import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega as chaves do seu arquivo .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// ⚠️ ATENÇÃO: O Bot usa a SERVICE_ROLE_KEY para ter "Poder de Deus" no banco de dados e ignorar bloqueios
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Erro: Chaves do Supabase não encontradas no .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function gerarDados() {
  console.log("🤖 Iniciando Bot de Testes...");

  // 1. Criar Materiais Falsos
  const materiais = Array.from({ length: 10 }).map((_, i) => ({
    mat_code: `BOT-MAT-${i}`,
    sku: `0000-BOT-${i}`,
    descricao: `Material Teste Bot ${i}`,
    unidade: 'UN',
    categoria: i % 2 === 0 ? 'Interno' : 'Externo',
    quantidade: 100
  }));

  const { error: errMat } = await supabase.from('materiais').insert(materiais);
  if (errMat) console.log("Erro Materiais:", errMat.message);
  else console.log("✅ 10 Materiais falsos criados.");

  // 2. Criar Obras Falsas
  const obras = Array.from({ length: 20 }).map((_, i) => ({
    obra_id: `ID-BOT-${Math.floor(Math.random() * 100000)}`,
    tecnico: `Técnico Robô ${i}`,
    cidade: 'Curitiba',
    endereco: `Rua das Máquinas, ${i}`,
    numero: `${i}00`,
    uf: 'PR',
    tipo_obra: i % 2 === 0 ? 'Adequacao' : 'Alivio',
    status: 'Nova'
  }));

  const { error: errObra } = await supabase.from('obras').insert(obras);
  if (errObra) console.log("Erro Obras:", errObra.message);
  else console.log("✅ 20 Obras falsas criadas.");

  console.log("🎉 Teste gerado! Vá para o sistema, faça seus testes e exporte o Excel.");
}

async function limparDados() {
  console.log("🧹 Iniciando limpeza do Bot...");

  // Deleta tudo que tem a palavra 'BOT' no ID ou SKU
  await supabase.from('obras').delete().ilike('obra_id', '%ID-BOT%');
  await supabase.from('materiais').delete().ilike('sku', '%BOT%');

  console.log("✨ Banco de dados limpo! Os dados de teste foram apagados.");
}

// O bot decide o que fazer baseado na palavra que digitarmos no terminal
const acao = process.argv[2];

if (acao === 'gerar') gerarDados();
else if (acao === 'limpar') limparDados();
else console.log("Comando inválido. Use 'gerar' ou 'limpar'.");