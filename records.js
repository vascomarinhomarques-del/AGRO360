export const recordModules = {
  maquinas: {
    title: 'Máquinas',
    eyebrow: 'EQUIPAMENTO AGRÍCOLA',
    description: 'Regista o equipamento e acompanha o seu estado e manutenção.',
    icon: 'machine',
    fields: [
      { name: 'name', label: 'Nome da máquina', placeholder: 'Ex.: Trator principal' },
      { name: 'type', label: 'Tipo de equipamento', placeholder: 'Ex.: Trator' },
      { name: 'status', label: 'Estado', type: 'select', options: ['Operacional', 'Em manutenção', 'Inativa'] },
      { name: 'lastMaintenance', label: 'Última manutenção', type: 'date', required: false }
    ]
  },
  animais: {
    title: 'Animais',
    eyebrow: 'REGISTO PECUÁRIO',
    description: 'Mantém os registos básicos e o estado de saúde dos animais.',
    icon: 'animal',
    fields: [
      { name: 'identification', label: 'Identificação', placeholder: 'Ex.: Lote A ou brinco 001' },
      { name: 'species', label: 'Espécie', placeholder: 'Ex.: Bovino' },
      { name: 'quantity', label: 'Quantidade', type: 'number', min: '1', step: '1' },
      { name: 'status', label: 'Estado de saúde', type: 'select', options: ['Saudável', 'A observar', 'Em tratamento'] }
    ]
  },
  stock: {
    title: 'Stock e Finanças',
    eyebrow: 'PRODUTOS E CUSTOS',
    description: 'Regista produtos, quantidades e custos associados à exploração.',
    icon: 'stock',
    fields: [
      { name: 'category', label: 'Tipo de registo', type: 'select', options: ['Produto', 'Custo'] },
      { name: 'name', label: 'Produto ou descrição do custo', placeholder: 'Ex.: Fertilizante' },
      { name: 'quantity', label: 'Quantidade', type: 'number', min: '0', step: '0.01' },
      { name: 'unit', label: 'Unidade', placeholder: 'Ex.: kg, L, unidade' },
      { name: 'value', label: 'Valor (€)', type: 'number', min: '0', step: '0.01' },
      { name: 'date', label: 'Data', type: 'date' }
    ]
  },
  funcionarios: {
    title: 'Funcionários',
    eyebrow: 'EQUIPA E TAREFAS',
    description: 'Organiza os dados da equipa e acompanha as tarefas atribuídas.',
    icon: 'people',
    fields: [
      { name: 'name', label: 'Nome', placeholder: 'Nome do funcionário' },
      { name: 'role', label: 'Função', placeholder: 'Ex.: Operador agrícola' },
      { name: 'task', label: 'Tarefa atribuída', placeholder: 'Ex.: Inspecionar o olival' },
      { name: 'status', label: 'Estado da tarefa', type: 'select', options: ['Pendente', 'Em curso', 'Concluída'] }
    ]
  },
  parcelas: {
    title: 'Parcelas',
    eyebrow: 'TERRENOS E TALHÕES',
    description: 'Organiza as parcelas e associa-as à exploração correspondente.',
    icon: 'land',
    fields: [
      { name: 'name', label: 'Nome da parcela', placeholder: 'Ex.: Olival Norte' },
      { name: 'fieldId', label: 'Exploração', type: 'select', optionSource: 'fields' },
      { name: 'area', label: 'Área (hectares)', type: 'number', min: '0.01', step: '0.01' },
      { name: 'crop', label: 'Cultura principal', placeholder: 'Ex.: Oliveira', required: false }
    ]
  },
  culturas: {
    title: 'Culturas',
    eyebrow: 'CADERNO DE CAMPO',
    description: 'Regista culturas, datas de plantação e produção prevista por parcela.',
    icon: 'leaf',
    fields: [
      { name: 'name', label: 'Nome da cultura', placeholder: 'Ex.: Trigo' },
      { name: 'type', label: 'Tipo ou variedade', placeholder: 'Ex.: Cevada dística' },
      { name: 'parcelId', label: 'Parcela', type: 'select', optionSource: 'parcels' },
      { name: 'plantingDate', label: 'Data de plantação', type: 'date' },
      { name: 'status', label: 'Estado', type: 'select', options: ['Planeada', 'Em crescimento', 'Pronta para colheita', 'Colhida'] },
      { name: 'expectedProduction', label: 'Produção prevista', placeholder: 'Ex.: 2 toneladas', required: false }
    ]
  },
  caderno: {
    title: 'Caderno de campo',
    eyebrow: 'REGISTO AGRÍCOLA',
    description: 'Regista intervenções e observações associadas a cada parcela.',
    icon: 'calendar',
    fields: [
      { name: 'parcelId', label: 'Parcela', type: 'select', optionSource: 'parcels' },
      { name: 'date', label: 'Data', type: 'date' },
      { name: 'activity', label: 'Atividade realizada', placeholder: 'Ex.: Tratamento fitossanitário' },
      { name: 'observations', label: 'Observações', type: 'textarea', required: false }
    ]
  },
  financas: {
    title: 'Custos e receitas',
    eyebrow: 'GESTÃO FINANCEIRA',
    description: 'Regista movimentos financeiros e associa-os às parcelas.',
    icon: 'stock',
    fields: [
      { name: 'type', label: 'Tipo de movimento', type: 'select', options: ['Despesa', 'Receita'] },
      { name: 'category', label: 'Categoria', placeholder: 'Ex.: Sementes, venda de produção' },
      { name: 'parcelId', label: 'Parcela', type: 'select', optionSource: 'parcels' },
      { name: 'date', label: 'Data', type: 'date' },
      { name: 'value', label: 'Valor (€)', type: 'number', min: '0.01', step: '0.01' },
      { name: 'description', label: 'Descrição', type: 'textarea', required: false }
    ]
  }
};

const storageKey = 'agro360.records';
const recordFields = Object.fromEntries(
  Object.entries(recordModules).map(([id, module]) => [id, ['id', ...module.fields.map((field) => field.name)]])
);

function emptyRecords() {
  return Object.fromEntries(Object.keys(recordModules).map((id) => [id, []]));
}

function isRecord(value, moduleId) {
  return value && typeof value === 'object'
    && recordFields[moduleId].every((field) => typeof value[field] === 'string');
}

export function loadRecords() {
  let saved;
  try {
    saved = localStorage.getItem(storageKey);
  } catch (error) {
    throw new Error('Não foi possível aceder aos registos guardados neste navegador.', { cause: error });
  }
  if (!saved) return emptyRecords();

  let records;
  try {
    records = JSON.parse(saved);
  } catch (error) {
    throw new Error('Os registos guardados estão inválidos. Os dados não foram alterados.', { cause: error });
  }
  if (!records || typeof records !== 'object' || Array.isArray(records)
    || !Object.entries(records).every(([id, entries]) => !recordModules[id]
      || (Array.isArray(entries) && entries.every((record) => isRecord(record, id))))) {
    throw new Error('Os registos guardados não têm o formato esperado. Os dados não foram alterados.');
  }
  return { ...emptyRecords(), ...records };
}

export function saveRecords(records) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(records));
    return true;
  } catch (error) {
    console.error('Não foi possível guardar os registos neste dispositivo.', error);
    return false;
  }
}
