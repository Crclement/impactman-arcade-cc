import FontFaceObserver from 'fontfaceobserver'


export const WaitForFontFamilyLoaded = async (families: string[]) => {
  await Promise.all(families.map(family => {
    new FontFaceObserver(family).load()
  }))
};
