const W = 40
const H = 24
const LAYERS = ["01 - worktop contact shadow", "02 - darker board edge and thickness", "03 - warm amber board face", "04 - rim highlights and quiet grain"]

func in_top(x, y):
	if x < 4 or x >= 36 or y < 3 or y >= 19:
		return false
	if (x < 6 or x >= 34) and (y < 5 or y >= 17):
		return x >= 5 and x < 35 and y >= 4 and y < 18
	if x < 7 and y >= 9 and y < 13:
		return false
	return true

func edge_top(x, y):
	return not in_top(x-1,y) or not in_top(x+1,y) or not in_top(x,y-1) or not in_top(x,y+1)

func in_body(x, y):
	return in_top(x,y) or in_top(x,y-1) or in_top(x,y-2)

func put(output, x, y, color):
	if x >= 0 and y >= 0 and x < W and y < H:
		output.set_pixel(x,y,Color(color))

func run(api, image, project, params):
	var output = Image.create(W,H,false,Image.FORMAT_RGBA8)
	output.fill(Color(0,0,0,0))
	var role = int(params.role)
	for y in range(H):
		for x in range(W):
			if role == 0 and in_top(x-1,y-3):
				put(output,x,y,"#46404b")
			elif role == 1 and in_body(x,y):
				var outer = not in_body(x-1,y) or not in_body(x+1,y) or not in_body(x,y-1) or not in_body(x,y+1)
				put(output,x,y,"#322c38" if outer else "#46404b")
			elif role == 2 and in_top(x,y):
				put(output,x,y,"#322c38" if edge_top(x,y) else "#e2ad68")
	if role == 3:
		# A single hard upper-left reflection keeps the original pixel density.
		for x in range(7,33):
			if in_top(x,4) and not edge_top(x,4):
				put(output,x,4,"#fff0d5")
		for y in range(6,17):
			if in_top(5,y) and not edge_top(5,y):
				put(output,5,y,"#fff0d5")
		# Two quiet cream grain clusters; the central prep area stays clear.
		for x in range(10,16):
			put(output,x,7,"#f1e5d1")
		for x in range(24,30):
			put(output,x,15,"#f1e5d1")
		# Inner hand-notch rim, with the same colored contour as the perimeter.
		for y in range(10,12):
			put(output,8,y,"#fff0d5")
	return output
