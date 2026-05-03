import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

const ALLOWED_ORIGIN = 'https://cadastro-material-v2.vercel.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Acesso negado: sem autenticação.')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Sessão inválida ou expirada.')

    // Buscar o perfil de quem está chamando para validar permissões
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: caller } = await supabaseAdmin
      .from('perfis')
      .select('role')
      .eq('id', user.id)
      .single()

    const callerRole = caller?.role ?? 'tecnico'

    // Técnico não pode fazer nada aqui
    if (callerRole === 'tecnico') {
      throw new Error('Acesso negado: permissão insuficiente.')
    }

    const { acao, email, password, nome, matricula, role, userId, senha } = await req.json()

    // ── CRIAR ──────────────────────────────────────────────────────────────
    if (acao === 'criar') {
      // Admin (staff) só pode criar técnicos
      if (callerRole === 'staff' && role !== 'tecnico') {
        throw new Error('Acesso negado: admins só podem criar técnicos.')
      }
      // Só master pode criar outro master
      if (role === 'master' && callerRole !== 'master') {
        throw new Error('Acesso negado: apenas o master pode criar outro master.')
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome, matricula, role }
      })
      if (authError) throw authError

      return new Response(JSON.stringify({ success: true, user: authData.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ── EDITAR ─────────────────────────────────────────────────────────────
    if (acao === 'editar') {
      // Buscar o perfil do alvo
      const { data: alvo } = await supabaseAdmin
        .from('perfis')
        .select('role')
        .eq('id', userId)
        .single()

      const alvoRole = alvo?.role ?? 'tecnico'

      // Admin não pode editar outros admins nem masters
      if (callerRole === 'staff' && alvoRole !== 'tecnico') {
        throw new Error('Acesso negado: admins só podem editar técnicos.')
      }
      // Admin não pode promover alguém a admin ou master
      if (callerRole === 'staff' && role !== 'tecnico') {
        throw new Error('Acesso negado: admins só podem definir role técnico.')
      }

      const { error: profileError } = await supabaseAdmin
        .from('perfis')
        .update({ nome, role })
        .eq('id', userId)
      if (profileError) throw profileError

      const updateData: any = { user_metadata: { nome, role } }
      if (senha && senha.trim().length > 0) updateData.password = senha

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData)
      if (authError) throw authError

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ── DELETAR ────────────────────────────────────────────────────────────
    if (acao === 'deletar') {
      const { data: alvo } = await supabaseAdmin
        .from('perfis')
        .select('role')
        .eq('id', userId)
        .single()

      const alvoRole = alvo?.role ?? 'tecnico'

      // Admin não pode deletar outros admins nem masters
      if (callerRole === 'staff' && alvoRole !== 'tecnico') {
        throw new Error('Acesso negado: admins só podem remover técnicos.')
      }
      // Ninguém pode se auto-deletar
      if (userId === user.id) {
        throw new Error('Você não pode remover sua própria conta.')
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Ação não reconhecida.')

  } catch (error: any) {
    console.error('ERRO:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
