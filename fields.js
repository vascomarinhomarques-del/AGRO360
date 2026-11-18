export const initialFields = [
  { id: 'ribeira', name: 'Quinta da Ribeira', place: 'Santarém · Ribatejo', area: '12,4 ha', crop: 'Olival tradicional', status: 'Saudável', tone: '', demo: true },
  { id: 'vale', name: 'Herdade do Vale', place: 'Évora · Alentejo', area: '8,2 ha', crop: 'Vinha do norte', status: 'Saudável', tone: 'gold', demo: true },
  { id: 'campo-novo', name: 'Campo Novo', place: 'Leiria · Oeste', area: '4,2 ha', crop: 'Horta de verão', status: 'Saudável', tone: 'blue', demo: true }
];

const storageKey = 'agro360.fields';

function isField(value) {
  return value && typeof value === 'object'
    && ['id', 'name', 'place', 'area', 'crop', 'status', 'tone'].every((key) => typeof value[key] === 'string')
    && (value.demo === undefined || typeof value.demo === 'boolean');
}

export function loadFields() {
  let saved;
  try {
    saved = localStorage.getItem(storageKey);
  } catch (error) {
    throw new Error('Não foi possível aceder às explorações guardadas neste navegador.', { cause: error });
  }
  if (!saved) return initialFields.map((field) => ({ ...field }));

  let fields;
  try {
    fields = JSON.parse(saved);
  } catch (error) {
    throw new Error('Os dados das explorações guardadas estão inválidos. Os dados não foram alterados.', { cause: error });
  }
  if (!Array.isArray(fields) || !fields.every(isField)) {
    throw new Error('Os dados das explorações guardadas não têm o formato esperado. Os dados não foram alterados.');
  }
  return fields;
}

export function saveFields(fields) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(fields));
    return true;
  } catch (error) {
    console.error('Não foi possível guardar as explorações neste dispositivo.', error);
    return false;
  }
}
