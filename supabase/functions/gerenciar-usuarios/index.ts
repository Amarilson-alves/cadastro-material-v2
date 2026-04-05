import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Recebe os dados da tela
    const { acao, email, password, nome, matricula, role, userId, senha } = await req.json()

    // Cria o cliente ADMIN com a chave secreta guardada na nuvem
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ==========================================
    // AÇÃO: CRIAR NOVO USUÁRIO
    // ==========================================
    if (acao === 'criar') {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (authError) throw authError

      const { error: profileError } = await supabaseAdmin.from('perfis').insert({
        id: authData.user.id,
        nome,
        matricula,
        role
      })
      
      if (profileError) {
         await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
         throw profileError
      }

      return new Response(JSON.stringify({ success: true, user: authData.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ==========================================
    // AÇÃO: EDITAR USUÁRIO
    // ==========================================
    if (acao === 'editar') {
      // 1. Atualiza Perfil Público
      const { error: profileError } = await supabaseAdmin.from('perfis').update({
        nome,
        role
      }).eq('id', userId)
      if (profileError) throw profileError

      // 2. Atualiza Auth e Senha (se o admin digitou uma senha nova)
      const updateData: any = { user_metadata: { nome, role } }
      if (senha && senha.trim().length > 0) {
        updateData.password = senha
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData)
      if (authError) throw authError

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ==========================================
    // AÇÃO: DELETAR USUÁRIO
    // ==========================================
    if (acao === 'deletar') {
       const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
       if (error) throw error

       return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('Ação não reconhecida.')

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})