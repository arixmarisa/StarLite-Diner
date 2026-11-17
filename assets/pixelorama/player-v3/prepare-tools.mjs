import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const previous = path.resolve(dir, '../player-v2');
let render = fs
  .readFileSync(path.join(previous, 'create-and-export.gd'), 'utf8')
  .replaceAll('player-v2', 'player-v3')
  .replaceAll('range(4)', 'range(8)')
  .replaceAll('80,96', '80,192')
  .replaceAll('"height":96', '"height":192')
  .replaceAll('"h":96', '"h":192')
  .replaceAll('480,576', '480,1152')
  .replaceAll('transparent(64,24)', 'transparent(128,24)')
  .replaceAll('idles.resize(384,144', 'idles.resize(768,144');
render = render.replace(
  '\tif not root.get_node("OpenSave").call(',
  '\tvar previous_sheet=Image.load_from_file(str(params.cardinal_sheet))\n\tif sheet.get_region(Rect2i(0,0,80,96)).get_data()!=previous_sheet.get_data():\n\t\treturn {"error":"Original cardinal frames changed; no save"}\n\tif not root.get_node("OpenSave").call(',
);
render = render.replace(
  '\tvar codes={}',
  `\tvar saved_zip=ZIPReader.new()
\tif saved_zip.open(source_dir.path_join("player.pxo"))!=OK:
\t\treturn {"error":"Saved PXO cannot be decoded"}
\tfor fi in range(40):
\t\tfor li in range(9):
\t\t\tvar raw=saved_zip.read_file("image_data/frames/"+str(fi+1)+"/layer_"+str(li+1))
\t\t\tif raw!=all_images[fi][li].get_data():
\t\t\t\treturn {"error":"Saved cel differs from authored layer","frame":fi,"layer":li}
\tsaved_zip.close()
\tvar codes={}`,
);
fs.writeFileSync(path.join(dir, 'create-and-export.gd'), render);
let verify = fs
  .readFileSync(path.join(previous, 'verify-and-export-motion.gd'), 'utf8')
  .replaceAll('data.frames.size()!=20', 'data.frames.size()!=40')
  .replaceAll('data.tags.size()!=8', 'data.tags.size()!=16')
  .replaceAll('range(20)', 'range(40)')
  .replaceAll('range(4)', 'range(8)')
  .replaceAll('blank(64,24)', 'blank(128,24)')
  .replaceAll('strip.resize(384,144', 'strip.resize(768,144');
verify = verify.replace(
  '\tvar report={',
  '\tvar previous_sheet=Image.load_from_file(str(params.cardinal_sheet))\n\tvar cardinal_exact=sheet.get_region(Rect2i(0,0,80,96)).get_data()==previous_sheet.get_data()\n\tvar report={"allOriginalCardinalFramesExact":cardinal_exact,',
);
verify = verify.replace(
  '\treturn {"sourceFrames":report.sourceFrames,',
  '\treturn {"allOriginalCardinalFramesExact":cardinal_exact,"savedCels":360,"sourceFrames":report.sourceFrames,',
);
verify = verify.replace(
  '\tvar palette_data=',
  `\tvar diagonal_idles=blank(64,24)
\tfor row in range(4):
\t\tdiagonal_idles.blit_rect(source_frames[(row+4)*5],Rect2i(0,0,16,24),Vector2i(row*16,0))
\tdiagonal_idles.save_png(output_dir.path_join("diagonal-idles.png"))
\tdiagonal_idles.resize(512,192,Image.INTERPOLATE_NEAREST)
\tdiagonal_idles.save_png(source_dir.path_join("diagonal-idles-preview.png"))
\tdiagonal_idles.save_png(output_dir.path_join("diagonal-idles-preview.png"))
\tvar diagonal_motion_frames=[]
\tfor step in range(1,5):
\t\tvar strip=blank(64,24)
\t\tfor row in range(4):
\t\t\tstrip.blit_rect(source_frames[(row+4)*5+step],Rect2i(0,0,16,24),Vector2i(row*16,0))
\t\tstrip.resize(384,144,Image.INTERPOLATE_NEAREST)
\t\tdiagonal_motion_frames.append(strip)
\tvar diagonal_motion=save_apng(diagonal_motion_frames,source_dir.path_join("diagonal-motion-preview.png"))
\tDirAccess.copy_absolute(source_dir.path_join("diagonal-motion-preview.png"),output_dir.path_join("diagonal-motion-preview.png"))
\tvar palette_data=`,
);
fs.writeFileSync(path.join(dir, 'verify-and-export-motion.gd'), verify);
