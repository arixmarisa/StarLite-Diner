func rect(output, x, y, width, height, color):
	output.fill_rect(Rect2i(x, y, width, height), Color(color))

func rounded(output, x, y, width, height, color):
	var ink = Color(color)
	output.fill_rect(Rect2i(x + 1, y, width - 2, height), ink)
	output.fill_rect(Rect2i(x, y + 1, width, height - 2), ink)

func run(api, image, project, params):
	var config = params.variant
	var output = Image.create(int(config.frame.width), int(config.frame.height), false, Image.FORMAT_RGBA8)
	output.fill(Color(0,0,0,0))
	var role = int(params.role)
	var outline = "#322c38"
	var shadow = "#46404b"
	var dark = "#676c70"
	var steel = "#9ba8a5"
	var light = "#d5dfd3"
	var mount = config.mount
	var mx = int(mount.x)
	var my = int(mount.y)
	var mw = int(mount.width)
	if role == 0:
		# The untouched24px side profile matches the accepted counter exactly.
		rect(output,mx,my,mw,1,outline)
		rect(output,mx,my+1,mw,1,light)
		rect(output,mx,my+2,mw,19,steel)
		rect(output,mx,my+21,mw,1,light)
		rect(output,mx,my+22,mw,1,steel)
		rect(output,mx,my+23,mw,1,outline)
		if bool(config.rearLip):
			rounded(output,mx,my-4,mw,4,outline)
			rect(output,mx+1,my-3,mw-2,1,light)
			rect(output,mx+1,my-2,mw-2,1,steel)
	elif role == 1:
		for bin_rect in config.bins:
			var bx = int(bin_rect.x)
			var by = int(bin_rect.y)
			rounded(output,bx,by,12,14,outline)
			rounded(output,bx+1,by+1,10,12,light)
	elif role == 2:
		for bin_rect in config.bins:
			var bx = int(bin_rect.x)
			var by = int(bin_rect.y)
			# Identical empty recessed floors; no contents or drain markings.
			rect(output,bx+2,by+2,8,10,dark)
			rect(output,bx+2,by+2,8,2,shadow)
			rect(output,bx+2,by+4,1,7,shadow)
			rect(output,bx+3,by+11,7,1,steel)
			rect(output,bx+9,by+4,1,7,steel)
	elif role == 3:
		for bin_rect in config.bins:
			var bx = int(bin_rect.x)
			var by = int(bin_rect.y)
			# Consistent rolled-rim highlights on upper/left edges.
			rect(output,bx+1,by+1,10,1,light)
			rect(output,bx+1,by+2,1,10,light)
			rect(output,bx+2,by+12,8,1,dark)
			rect(output,bx+10,by+2,1,10,dark)
	return output
