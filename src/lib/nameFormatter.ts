export const formatAcademicTitle = (name: string): string => {
  if (!name) return '';
  return name
    .replace(/\bS\.pd\b/gi, 'S.Pd')
    .replace(/\bM\.pd\b/gi, 'M.Pd')
    .replace(/\bS\.t\b/gi, 'S.T')
    .replace(/\bM\.t\b/gi, 'M.T')
    .replace(/\bS\.pd\.i\b/gi, 'S.Pd.I')
    .replace(/\bM\.pd\.i\b/gi, 'M.Pd.I')
    .replace(/\bS\.e\b/gi, 'S.E')
    .replace(/\bM\.e\b/gi, 'M.E')
    .replace(/\bS\.h\b/gi, 'S.H')
    .replace(/\bM\.h\b/gi, 'M.H')
    .replace(/\bDr\.\b/gi, 'Dr.')
    .replace(/\bdr\.\b/gi, 'dr.');
};
