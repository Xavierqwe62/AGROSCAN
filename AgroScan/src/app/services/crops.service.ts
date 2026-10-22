import { Injectable, signal } from '@angular/core';
import { Crop, CropSource } from '../models/crop';

const extension = (slug: string): CropSource => ({
  label: 'Universidad de Minnesota · manejo del cultivo',
  url: `https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/${slug}`,
});
const salinity: CropSource = {
  label: 'FAO · salinidad del suelo (tabla 4)',
  url: 'https://www.fao.org/4/T0234e/T0234E03.htm',
};

/**
 * INITIAL REFERENCE CATALOG, created for the Angular starter delivered in this
 * checkout. No previous CropsService or original ten-crop dataset was present.
 * This is not a recovered or preserved original dataset. Replace these entries
 * with the owner's original records if provided, preserving stable IDs used by
 * saved parcels. Sources checked October 2026; adapt references to local variety,
 * climate and soil analysis. No sensor values or diagnoses are fabricated.
 */
export const INITIAL_CROPS: readonly Crop[] = [
  {
    id: 'maiz',
    name: 'Maíz',
    scientificName: 'Zea mays',
    category: 'Cereales',
    description: 'Un cereal esencial que acompaña al campo desde la siembra hasta la mazorca.',
    soil: 'Profundo, drenado y con materia orgánica',
    temperature: '20–30 °C',
    humidity: 'Uniforme, sin encharcar',
    ph: '5.8–7.0',
    ec: '1.7 dS/m',
    irrigation:
      'Conserva humedad en la zona de raíces; ajusta el riego a la lluvia y al tipo de suelo. Evita estrés hídrico durante la floración.',
    stages: ['Germinación', 'Desarrollo vegetativo', 'Floración', 'Llenado de grano', 'Madurez'],
    image: 'assets/crops/maiz.webp',
    sources: [
      extension('growing-sweet-corn'),
      {
        label: 'FAO · perfil de maíz (temperatura)',
        url: 'https://s3.eu-west-1.amazonaws.com/data.gaezdev.aws.fao.org/crop_profiles/GAEZ_Crop_profile_maize.pdf',
      },
      salinity,
    ],
  },
  {
    id: 'tomate',
    name: 'Tomate',
    scientificName: 'Solanum lycopersicum',
    category: 'Hortalizas',
    description: 'Frutos llenos de color que necesitan sol, buen drenaje y cuidados constantes.',
    soil: 'Fértil, drenado y enriquecido con composta',
    temperature: 'Cálido, sin heladas',
    humidity: 'Estable en las raíces',
    ph: '5.5–7.0',
    ec: '2.5 dS/m',
    irrigation:
      'Riega en la base y evita cambios bruscos entre sequedad y exceso de agua. Usa cobertura para conservar la humedad.',
    stages: ['Semillero', 'Trasplante', 'Floración', 'Fructificación', 'Cosecha'],
    image: 'assets/crops/tomate.webp',
    sources: [extension('growing-tomatoes'), salinity],
  },
  {
    id: 'trigo',
    name: 'Trigo',
    scientificName: 'Triticum aestivum',
    category: 'Cereales',
    description: 'Espigas doradas de clima fresco, con un ciclo que varía según la variedad.',
    soil: 'Drenado; ajustar fertilidad con análisis',
    temperature: '16–21 °C aprox.',
    humidity: 'Evitar déficit en espigado',
    ph: 'Según análisis local',
    ec: '6.0 dS/m*',
    irrigation:
      'Ajusta la aportación a la lluvia y la reserva del suelo. La floración y el llenado de grano son periodos sensibles. *En germinación, la tolerancia a salinidad es menor.',
    stages: ['Emergencia', 'Macollamiento', 'Encañado', 'Espigado', 'Llenado y madurez'],
    image: 'assets/crops/trigo.webp',
    sources: [
      {
        label: 'Universidad de Minnesota · temperatura y desarrollo',
        url: 'https://blog-crop-news.extension.umn.edu/2020/06/heat-stress-on-small-grains.html',
      },
      {
        label: 'FAO · periodos sensibles al déficit hídrico',
        url: 'https://www.fao.org/4/t7202e/t7202e05.htm',
      },
      salinity,
    ],
  },
  {
    id: 'frijol',
    name: 'Frijol',
    scientificName: 'Phaseolus vulgaris',
    category: 'Leguminosas',
    description: 'Una leguminosa versátil, de vainas tiernas o granos secos según la cosecha.',
    soil: 'Franco arcilloso o limoso, bien drenado',
    temperature: 'Cálido, sin heladas',
    humidity: 'Sin sequía prolongada',
    ph: '6.0–7.0',
    ec: '1.0 dS/m',
    irrigation:
      'Revisa la humedad bajo la superficie. Los suelos arenosos necesitan riegos más frecuentes; cuida el aporte durante floración y llenado de vainas.',
    stages: ['Emergencia', 'Desarrollo vegetativo', 'Floración', 'Formación de vainas', 'Madurez'],
    image: 'assets/crops/frijol.webp',
    sources: [
      extension('growing-beans'),
      {
        label: 'FAO · periodos sensibles al déficit hídrico',
        url: 'https://www.fao.org/4/t7202e/t7202e05.htm',
      },
      salinity,
    ],
  },
  {
    id: 'aguacate',
    name: 'Aguacate',
    scientificName: 'Persea americana',
    category: 'Frutales',
    description:
      'Un frutal de raíces delicadas que agradece un suelo aireado y cuidados a largo plazo.',
    soil: 'Aireado y con excelente drenaje',
    temperature: 'Tropical / subtropical',
    humidity: 'Húmedo, nunca saturado',
    ph: 'Alrededor de 6.0',
    ec: 'Sensible; sin umbral general',
    irrigation:
      'Distribuye el agua en la zona de raíces y ajusta al tamaño del árbol y al clima. Evita agua estancada junto al tronco.',
    stages: ['Establecimiento', 'Brotación', 'Floración', 'Cuajado', 'Desarrollo de fruto'],
    image: 'assets/crops/aguacate.webp',
    sources: [
      {
        label: 'Universidad de California · manejo del aguacate',
        url: 'https://ipm.ucanr.edu/home-and-landscape/cultural-tips-for-growing-avocado/',
      },
      {
        label: 'Universidad de California · suelo y portainjertos',
        url: 'https://ucanr.edu/blog/topics-subtropics/article/questions-and-answers-about-avocado-varieties-and-rootstocks',
      },
      salinity,
    ],
  },
  {
    id: 'chile',
    name: 'Chile',
    scientificName: 'Capsicum annuum',
    category: 'Hortalizas',
    description: 'Color y carácter en cada fruto, con variedades adaptadas a distintos climas.',
    soil: 'Drenado, con materia orgánica',
    temperature: 'Cálido, sin heladas',
    humidity: 'Constante, sin saturación',
    ph: '6.5–7.0',
    ec: '1.5 dS/m',
    irrigation:
      'Mantén humedad regular sin saturar el suelo. La cobertura ayuda a conservar agua; evita mojar el follaje de forma prolongada.',
    stages: ['Semillero', 'Trasplante', 'Floración', 'Desarrollo de fruto', 'Cosecha'],
    image: 'assets/crops/chile.webp',
    sources: [extension('growing-peppers'), salinity],
  },
  {
    id: 'papa',
    name: 'Papa',
    scientificName: 'Solanum tuberosum',
    category: 'Hortalizas',
    description: 'Tubérculos que se desarrollan bajo tierra y requieren un suelo suelto y cuidado.',
    soil: 'Arenoso, suelto y bien drenado',
    temperature: 'Templado fresco',
    humidity: 'Uniforme en tuberización',
    ph: '6.0–6.5',
    ec: '1.7 dS/m',
    irrigation:
      'Evita que el suelo se seque durante la formación de tubérculos. Riega con profundidad y adapta la frecuencia al drenaje.',
    stages: ['Brotación', 'Desarrollo vegetativo', 'Tuberización', 'Engrosamiento', 'Madurez'],
    image: 'assets/crops/papa.webp',
    sources: [extension('growing-potatoes'), salinity],
  },
  {
    id: 'lechuga',
    name: 'Lechuga',
    scientificName: 'Lactuca sativa',
    category: 'Hortalizas',
    description: 'Hojas frescas de crecimiento rápido, ideales para un ciclo de clima suave.',
    soil: 'Drenado, fértil y que retenga humedad',
    temperature: '10–20 °C aprox.',
    humidity: 'Regular en raíces someras',
    ph: '6.0–6.8',
    ec: '1.3 dS/m',
    irrigation:
      'Aplica riegos regulares, ajustados a sus raíces superficiales. Evita periodos secos y exceso de agua; el calor favorece el espigado.',
    stages: ['Germinación', 'Plántula', 'Desarrollo de hojas', 'Formación de cabeza', 'Cosecha'],
    image: 'assets/crops/lechuga.webp',
    sources: [extension('growing-lettuce-endive-and-radicchio'), salinity],
  },
  {
    id: 'zanahoria',
    name: 'Zanahoria',
    scientificName: 'Daucus carota',
    category: 'Hortalizas',
    description: 'Una raíz de colores cálidos que crece mejor con espacio y sin suelo compacto.',
    soil: 'Franco arenoso, profundo y sin piedras',
    temperature: 'Clima fresco',
    humidity: 'Superficie húmeda al germinar',
    ph: '6.0–7.0',
    ec: '1.0 dS/m',
    irrigation:
      'Mantén húmeda la cama de siembra para facilitar la emergencia. Después conserva humedad uniforme para que la raíz crezca sin estrés.',
    stages: ['Germinación', 'Desarrollo de hojas', 'Engrosamiento de raíz', 'Cosecha'],
    image: 'assets/crops/zanahoria.webp',
    sources: [extension('growing-carrots-and-parsnips'), salinity],
  },
  {
    id: 'fresa',
    name: 'Fresa',
    scientificName: 'Fragaria × ananassa',
    category: 'Frutales',
    description: 'Pequeños frutos de gran color que necesitan luz y un manejo cuidadoso del agua.',
    soil: 'Franco arenoso, profundo y drenado',
    temperature: '7–29 °C*',
    humidity: 'Raíces húmedas, fruto seco',
    ph: '6.0–6.5',
    ec: 'Sensible; sin umbral general',
    irrigation:
      'Usa goteo para aportar agua sin humedecer los frutos. Evita saturación y ajusta a lluvia y suelo. *Rango orientativo para variedades de día neutro.',
    stages: ['Establecimiento', 'Desarrollo vegetativo', 'Floración', 'Fructificación', 'Cosecha'],
    image: 'assets/crops/fresa.webp',
    sources: [
      {
        label: 'Universidad de California · manejo de fresa',
        url: 'https://ipm.ucanr.edu/home-and-landscape/cultural-tips-for-growing-strawberry/',
      },
      {
        label: 'Universidad de Minnesota · variedades de día neutro',
        url: 'https://extension.umn.edu/agriculture/specialty-crops/commercial-fruit-production/strawberry-farming/day-neutral-strawberries',
      },
      salinity,
    ],
  },
];

export function normalizeCropSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}

@Injectable({ providedIn: 'root' })
export class CropsService {
  readonly crops = INITIAL_CROPS;
  readonly search = signal('');
  readonly selectedCrop = signal<Crop | null>(null);

  selectCrop(id: string): void {
    this.selectedCrop.set(this.crops.find((crop) => crop.id === id) ?? null);
  }
}
