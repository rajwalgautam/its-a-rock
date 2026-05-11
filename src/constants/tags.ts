import { RouteTag, RouteTagId } from '@/types';

export const ROUTE_TAGS: Record<RouteTagId, RouteTag> = {
  slopey: { id: 'slopey', label: 'Slopey', category: 'hold', color: '#8FA6B8' },
  crimpy: { id: 'crimpy', label: 'Crimpy', category: 'hold', color: '#BD7A5A' },
  pinchy: { id: 'pinchy', label: 'Pinchy', category: 'hold', color: '#C2914B' },
  juggy: { id: 'juggy', label: 'Juggy', category: 'hold', color: '#679E6E' },
  pocket: { id: 'pocket', label: 'Pocket', category: 'hold', color: '#8C6E9E' },
  technical: { id: 'technical', label: 'Technical', category: 'style', color: '#4D6F8F' },
  powerful: { id: 'powerful', label: 'Powerful', category: 'style', color: '#C94B4B' },
  balance: { id: 'balance', label: 'Balance', category: 'style', color: '#6F9271' },
  dynamic: { id: 'dynamic', label: 'Dynamic', category: 'movement', color: '#D8892E' },
  static: { id: 'static', label: 'Static', category: 'movement', color: '#77706A' },
  compression: { id: 'compression', label: 'Compression', category: 'movement', color: '#A95D73' },
  overhang: { id: 'overhang', label: 'Overhang', category: 'angle', color: '#735E9F' },
  slab: { id: 'slab', label: 'Slab', category: 'angle', color: '#D6A655' },
  vertical: { id: 'vertical', label: 'Vertical', category: 'angle', color: '#5A9B9F' },
  long_route: { id: 'long_route', label: 'Long route', category: 'endurance', color: '#6F8E4F' },
  short_route: { id: 'short_route', label: 'Short route', category: 'endurance', color: '#B56B4D' },
  reachy: { id: 'reachy', label: 'Reachy', category: 'position', color: '#7F7BA6' },
  coordination: { id: 'coordination', label: 'Coordination', category: 'movement', color: '#4F91A3' },
  footwork: { id: 'footwork', label: 'Footwork', category: 'technique', color: '#8B8F55' },
  project: { id: 'project', label: 'Project', category: 'status', color: '#C77D36' },
};

export const ROUTE_TAG_ORDER = Object.keys(ROUTE_TAGS) as RouteTagId[];
