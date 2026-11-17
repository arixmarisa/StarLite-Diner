# Run only inside Pixelorama MCP. Every primitive uses integer native coordinates.
const C = {"outline":"#322c38","shadow":"#46404b","metalDark":"#676c70","metal":"#9ba8a5","metalLight":"#d5dfd3","glint":"#fff0d5","rose":"#ee75a3","roseLight":"#ffacc9","table":"#f1e5d1"}

func rect(canvas, x, y, w, h, color):
	canvas.fill_rect(Rect2i(x,y,w,h), Color(C.get(color,color)))

func bevel(canvas, x, y, w, h, color):
	rect(canvas,x+2,y,w-4,h,color)
	rect(canvas,x+1,y+1,w-2,h-2,color)
	rect(canvas,x,y+2,w,h-4,color)

func disc(canvas, cx, cy, radius, color):
	for y in range(cy-radius,cy+radius+1):
		for x in range(cx-radius,cx+radius+1):
			if (x-cx)*(x-cx)+(y-cy)*(y-cy) <= radius*radius:
				canvas.set_pixel(x,y,Color(C.get(color,color)))

func run(api, image, project, params):
	var kind = str(params.kind)
	var role = int(params.role)
	var size = Vector2i(288,192) if kind == "grill" else Vector2i(64,56)
	var canvas = Image.create(size.x,size.y,false,Image.FORMAT_RGBA8)
	canvas.fill(Color(0,0,0,0))
	if kind == "grill":
		match role:
			0:
				bevel(canvas,2,2,286,190,"shadow")
			1:
				bevel(canvas,0,0,286,190,"outline")
				bevel(canvas,1,1,284,188,"metal")
				bevel(canvas,2,2,282,186,"metalLight")
				bevel(canvas,4,4,278,182,"metal")
				# Entire control deck is a horizontal top-facing plane.
				rect(canvas,5,168,276,17,"metalLight")
				rect(canvas,5,169,276,15,"metal")
			2:
				bevel(canvas,9,9,270,150,"outline")
				bevel(canvas,10,10,268,148,"shadow")
				rect(canvas,12,12,264,144,"metalDark")
				# Sparse edge-only reflected light leaves the plate uninterrupted.
				rect(canvas,12,12,264,1,"metal")
				rect(canvas,12,13,1,142,"metal")
			3:
				# Shallow open grease channel, viewed from above; no cabinet face.
				bevel(canvas,10,160,268,7,"outline")
				rect(canvas,12,161,264,4,"shadow")
				rect(canvas,12,165,264,1,"metalLight")
				rect(canvas,265,161,9,4,"metalDark")
			4:
				for cx in [44,104,164,224]:
					disc(canvas,cx+1,178,7,"shadow")
					disc(canvas,cx,177,7,"outline")
					disc(canvas,cx,177,6,"metalLight")
					disc(canvas,cx+1,178,5,"metalDark")
					disc(canvas,cx,177,4,"shadow")
					rect(canvas,cx-1,172,2,4,"glint")
			5:
				# Short coherent reflection clusters; no random texture or grid.
				rect(canvas,5,2,142,1,"glint")
				rect(canvas,2,5,1,85,"glint")
				rect(canvas,284,5,1,178,"metalDark")
				rect(canvas,5,187,276,1,"metalDark")
				bevel(canvas,260,174,13,7,"outline")
				rect(canvas,262,175,9,4,"rose")
				rect(canvas,262,175,9,1,"roseLight")
	else:
		match role:
			0:
				bevel(canvas,2,2,62,54,"shadow")
			1:
				bevel(canvas,0,0,62,54,"outline")
				bevel(canvas,1,1,60,52,"metalLight")
				bevel(canvas,3,3,56,48,"metal")
				bevel(canvas,5,5,52,44,"metalDark")
				bevel(canvas,6,6,50,42,"metalLight")
			2:
				rect(canvas,7,7,48,1,"glint")
				rect(canvas,7,8,1,38,"glint")
				rect(canvas,7,47,48,1,"metal")
				rect(canvas,55,8,1,39,"metal")
	return canvas
