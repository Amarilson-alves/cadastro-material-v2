import * as XLSX from 'xlsx';
import type { Obra } from '@/types';
import { formatarData } from '@/lib/utils';

export function exportarObrasExcel(obras: Obra[]): void {
  const linhasMateriais = obras.flatMap((obra) => {
    const base = {
      Data:      formatarData(obra.criado_em),
      Tecnico:   obra.tecnico,
      Cidade:    obra.cidade,
      UF:        obra.uf,
      Cluster:   obra.cluster ?? '',   // ← aparece só no relatório
      Endereco:  obra.endereco,
      Numero:    obra.numero,
      Tipo_Obra: obra.tipo_obra,
      Status:    obra.status,
      Obs:       obra.obs ?? '',
    };
    const mats = obra.materiais_utilizados ?? [];
    if (mats.length === 0)
      return [{ ...base, Mat_Code: '', SKU: '', Descricao: '', Unidade: '', Quantidade: 0 }];
    return mats.map((m) => ({
      ...base,
      Mat_Code:   m.mat_code,
      SKU:        m.sku,
      Descricao:  m.descricao,
      Unidade:    m.unidade,
      Quantidade: m.quantidade,
    }));
  });

  const linhasResumo = obras.map((obra) => ({
    Data:             formatarData(obra.criado_em),
    Tecnico:          obra.tecnico,
    Cidade:           obra.cidade,
    UF:               obra.uf,
    Cluster:          obra.cluster ?? '',   // ← aparece só no relatório
    Endereco:         `${obra.endereco}, ${obra.numero}`,
    Tipo_Obra:        obra.tipo_obra,
    Status:           obra.status,
    Total_Itens:      obra.materiais_utilizados?.length ?? 0,
    Total_Quantidade: obra.materiais_utilizados?.reduce((s, m) => s + m.quantidade, 0) ?? 0,
  }));

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(linhasMateriais);
  const ws2 = XLSX.utils.json_to_sheet(linhasResumo);

  ws1['!cols'] = [10, 20, 18, 5, 15, 25, 8, 12, 10, 25, 12, 25, 8, 10].map((w) => ({ wch: w }));
  ws2['!cols'] = [10, 20, 18, 5, 15, 30, 12, 10, 10, 14].map((w) => ({ wch: w }));

  XLSX.utils.book_append_sheet(wb, ws1, 'Materiais por Obra');
  XLSX.utils.book_append_sheet(wb, ws2, 'Resumo');

  const d = new Date();
  const nome = `obras_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.xlsx`;
  XLSX.writeFile(wb, nome);
}
