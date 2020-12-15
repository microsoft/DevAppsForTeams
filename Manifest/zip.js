const AdmZip = require('adm-zip');
const zip = new AdmZip();   

zip.addLocalFile('color.png');
zip.addLocalFile('manifest.json');
zip.addLocalFile('outline.png');

zip.writeZip('package/TailwindTraders.zip');