export enum EditionFamily {
  COMMUNITY = 'COMMUNITY',
  COMMERCIAL = 'COMMERCIAL',
}

export enum EditionFamilyLabel {
  COMMUNITY = 'Community Edition',
  COMMERCIAL = 'Commercial editions',
}

export enum Edition {
  // Pre 2.5.0
  CRE = 'raw',
  CEE = 'cee',
  CCE = 'cce',
  CME = 'cme',
  CSE = 'cse',

  //2.5.0
  COMMUNITY = 'community',
  PRO = 'pro',
  ULTIMATE = 'ultimate',
  ULTIMATE_MULTI_TENANCY = 'ultimatemt',
  CLOUD = 'cloud',
}

export const getEditionFamily = (editionTag: string | Edition): EditionFamily => {
  const commercialEditions: Array<string | Edition> = [
    'CEE',
    'cee',
    'cce',
    'cme',
    'cse',
    'pro',
    'ultimate',
    'ultimatemt',
    'cloud',
    Edition.CEE,
    Edition.CCE,
    Edition.CME,
    Edition.CSE,
    Edition.PRO,
    Edition.ULTIMATE,
    Edition.ULTIMATE_MULTI_TENANCY,
    Edition.CLOUD,
  ];
  return commercialEditions.includes(editionTag) ? EditionFamily.COMMERCIAL : EditionFamily.COMMUNITY;
};

export const isCloudEdition = (editionTag: string | Edition): boolean => {
  return ['cse', 'cloud', Edition.CLOUD, Edition.CSE].includes(editionTag);
};
