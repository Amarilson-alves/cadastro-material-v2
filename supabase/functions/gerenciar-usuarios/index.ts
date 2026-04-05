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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Acesso negado: Crachá não encontrado.')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Acesso negado: Sessão inválida ou expirada.')
    }

    const { acao, email, password, nome, matricula, role, userId, senha } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (acao === 'criar') {
      // 🚨 CORREÇÃO: Voltamos a mandar o user_metadata para alimentar o seu gatilho automático!
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
          nome: nome, 
          matricula: matricula, 
          role: role 
        }
      })
      if (authError) throw authError

      // Removemos o insert manual na tabela 'perfis' porque o seu banco já faz isso sozinho!

      return new Response(JSON.stringify({ success: true, user: authData.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (acao === 'editar') {
      const { error: profileError } = await supabaseAdmin.from('perfis').update({
        nome,
        role
      }).eq('id', userId)
      if (profileError) throw profileError

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
    console.error("ERRO NO COFRE:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Voltei para o padrão correto do sistema
    })
  }
})