func blank(width,height):
	var out=Image.create(width,height,false,Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	return out

func blend(images):
	var out=blank(16,24)
	for img in images:
		out.blend_rect(img,Rect2i(0,0,16,24),Vector2i.ZERO)
	return out

func be32(value):
	return PackedByteArray([(int(value)>>24)&255,(int(value)>>16)&255,(int(value)>>8)&255,int(value)&255])

func be16(value):
	return PackedByteArray([(int(value)>>8)&255,int(value)&255])

func read32(data, offset):
	return (int(data[offset])<<24)|(int(data[offset+1])<<16)|(int(data[offset+2])<<8)|int(data[offset+3])

func crc32(data):
	var crc=0xffffffff
	for byte in data:
		crc=crc^int(byte)
		for bit in range(8):
			crc=(crc>>1)^0xedb88320 if (crc&1)!=0 else crc>>1
	return (crc^0xffffffff)&0xffffffff

func chunk(kind,payload):
	var data=kind.to_ascii_buffer()
	data.append_array(payload)
	var out=be32(payload.size())
	out.append_array(data)
	out.append_array(be32(crc32(data)))
	return out

func png_parts(image):
	var png=image.save_png_to_buffer()
	var cursor=8
	var header=PackedByteArray()
	var compressed=PackedByteArray()
	while cursor<png.size():
		var length=read32(png,cursor)
		var kind=png.slice(cursor+4,cursor+8).get_string_from_ascii()
		var body=png.slice(cursor+8,cursor+8+length)
		if kind=="IHDR":
			header=body
		elif kind=="IDAT":
			compressed.append_array(body)
		cursor+=12+length
	return {"header":header,"compressed":compressed}

func save_apng(frames,path):
	var first=png_parts(frames[0])
	var output=PackedByteArray([137,80,78,71,13,10,26,10])
	output.append_array(chunk("IHDR",first.header))
	var control=be32(frames.size())
	control.append_array(be32(0))
	output.append_array(chunk("acTL",control))
	var sequence=0
	for frame_index in range(frames.size()):
		var data=be32(sequence)
		sequence+=1
		data.append_array(be32(frames[frame_index].get_width()))
		data.append_array(be32(frames[frame_index].get_height()))
		data.append_array(be32(0))
		data.append_array(be32(0))
		data.append_array(be16(1))
		data.append_array(be16(8))
		data.append(0)
		data.append(0)
		output.append_array(chunk("fcTL",data))
		var content=first if frame_index==0 else png_parts(frames[frame_index])
		if frame_index==0:
			output.append_array(chunk("IDAT",content.compressed))
		else:
			var animation_data=be32(sequence)
			sequence+=1
			animation_data.append_array(content.compressed)
			output.append_array(chunk("fdAT",animation_data))
	output.append_array(chunk("IEND",PackedByteArray()))
	var file=FileAccess.open(path,FileAccess.WRITE)
	if file==null:
		return {"error":"Cannot write APNG"}
	file.store_buffer(output)
	file.close()
	return {"frames":frames.size(),"width":frames[0].get_width(),"height":frames[0].get_height(),"fps":8,"loops":0,"bytes":output.size()}

func run(api,image,project,params):
	var root=Engine.get_main_loop().root
	var active=root.get_node("Global").get("current_project")
	var source=str(params.source_dir)
	var output=str(params.output_dir)
	var sheets=[]
	var reports={}
	var combined_frames=[]
	for family in ["male","female"]:
		var sheet=Image.load_from_file(output.path_join(family+".png"))
		if sheet.get_size()!=Vector2i(96,288): return {"error":"Wrong native sheet"}
		sheets.append(sheet)
		var frames=[]
		for phase in range(4):
			var display=blank(64,72)
			for outfit in range(3):
				for direction in range(4):
					display.blit_rect(sheet,Rect2i((phase+1)*16,(outfit*4+direction)*24,16,24),Vector2i(direction*16,outfit*24))
			display.resize(512,576,Image.INTERPOLATE_NEAREST)
			frames.append(display)
		reports[family]=save_apng(frames,source.path_join(family+"-motion-preview.png"))
		save_apng(frames,output.path_join(family+"-motion-preview.png"))
		for outfit in range(3):
			var outfit_frames=[]
			for phase in range(4): outfit_frames.append(frames[phase].get_region(Rect2i(0,outfit*192,512,192)))
			save_apng(outfit_frames,output.path_join(family+"-outfit-"+str(outfit+1)+"-motion-preview.png"))
	for phase in range(4):
		var display=blank(128,72)
		for base in range(2):
			for outfit in range(3):
				for direction in range(4):
					display.blit_rect(sheets[base],Rect2i((phase+1)*16,(outfit*4+direction)*24,16,24),Vector2i(base*64+direction*16,outfit*24))
		display.resize(768,432,Image.INTERPOLATE_NEAREST)
		combined_frames.append(display)
	reports.combined=save_apng(combined_frames,source.path_join("customers-motion-preview.png"))
	save_apng(combined_frames,output.path_join("customers-motion-preview.png"))
	reports.activeProjectUnchanged=root.get_node("Global").get("current_project")==active
	return reports

