import ICAL from 'ical.js';
import * as Expo from 'expo';

export const getDataFromUrlAsync = async () => {
    try {
      let response = await fetch('https://cloud.timeedit.net/chalmers/web/public/ri663Q40Y88Z55Q5Y484X765y5Z854Y613Y7361Q547146XX2755238555411XY63745657X3Y5Y816X4378458X7465175386X16Y58156Y5366438X563Y5674Y4133557X15Y15X5366X67557334Y13Y346XX557186374Y515453X75612364359673X131YY5X75445454367YXY35851417465XX61Y943X1557W3Y733541576YX4594YX533130576Y4X8152X3634165666X91750Y36Y5841302X93X06Y6686591Y055X996463659Y913Y0391Y506109XX9656736856011XY93905965X3Y6Y619X0316066X1095115360X11Y69156Y5664435X513Y6164Y5113150X11Y12X5366XX9W510200Y4941X55365Y6X85103Y6174553XY64X1036X63510Y9935511051661889XY4326Y6120X7X58Y23035465235Y663601128YX6587YX633160526Y0X6150X8830165286X81260Y32Y5661307X83X04Y2166581Y055X286963152Y813Y3361Y502108XX72565366735Y1X2X371783859Y622YXX18061W6500X51077885YX236Y3X2800813658X12386121Y058765Y72Y8576X05X63380412Y0201X55386Y8X76123Y7180563XY80X1038X62588Y2235681051660220XY0356Y6150X7X52Y56035765538Y633601152YX65X6YX633195556Y0X6168X22301W5623X21560Y355506Y2115X4512566035XY016250X32336600XY40270Y5516Y1X5506632262531YY50X0015X32580306YX51906136501X5Y051225YX035Y3X5144613551X89386191Y096265Y39Y6512X45X53380515Y4181X55305Y6X75113Y0104553XY64X1436X55569Y11355010Z1Q66Z2973435dYQZ05X1F56Y07Qt5955n313660C7Q109Ft092ED76E57A29B698B42A9419A.ics');  
      let responseString = await response.text();
      return responseString;
    } catch (error) {
      console.error(error);
    }
  }
  
export const getLocale = async () => {
  return await Expo.Localization.locale;
}
  
export const parseIcal = async () => {
	let result = await getDataFromUrlAsync();
	jcalData = ICAL.parse(result);
	comp = new ICAL.Component(jcalData);
	vevents = comp.getAllSubcomponents("vevent");
	return vevents;
}
  
export const loadAssetsAsync = async () => {
	return await Expo.Font.loadAsync({
		latoBold: require('../../res/assets/fonts/LatoBlack.ttf'),
		latoLight: require('../../res/assets/fonts/LatoLight.ttf'),
		montLight: require('../../res/assets/fonts/MontLight.otf'),
		montBold: require('../../res/assets/fonts/MontBold.otf'),
	});
};