const W = 120
const H = 40
const COLORS = {
	"outline": "#322c38", "shadow": "#46404b", "metalDark": "#676c70",
	"metal": "#9ba8a5", "metalLight": "#d5dfd3", "glint": "#fff0d5",
	"roseDark": "#9f385e", "roseShade": "#c94d7b", "rose": "#ee75a3",
	"roseLight": "#ffacc9", "rosePale": "#ffd2de", "tableRim": "#a6bcb2",
	"table": "#f1e5d1", "tableLight": "#fff5df"
}

func rect(pic, x, y, w, h, color):
	pic.fill_rect(Rect2i(x, y, w, h), Color(COLORS[color]))

func disk(pic, cx, cy, radius, color):
	for y in range(int(floor(cy-radius)), int(ceil(cy+radius))+1):
		for x in range(int(floor(cx-radius)), int(ceil(cx+radius))+1):
			if Vector2(x-cx,y-cy).length_squared() <= radius*radius:
				pic.set_pixel(x,y,Color(COLORS[color]))

func capsule(pic, x, y, width, height, color):
	var r = (height-1)*0.5
	var left = x+r
	var right = x+width-1-r
	for yy in range(y,y+height):
		for xx in range(x,x+width):
			var nearest = clamp(float(xx),left,right)
			if Vector2(xx-nearest,yy-y-r).length_squared() <= (r+0.25)*(r+0.25):
				pic.set_pixel(xx,yy,Color(COLORS[color]))

func diagonal(pic, ax, ay, bx, by, width, color):
	var start = Vector2(ax,ay)
	var end = Vector2(bx,by)
	var delta = end-start
	for y in range(min(ay,by)-width,max(ay,by)+width+1):
		for x in range(min(ax,bx)-width,max(ax,bx)+width+1):
			var amount = clamp((Vector2(x,y)-start).dot(delta)/delta.length_squared(),0.0,1.0)
			if Vector2(x,y).distance_to(start+delta*amount) <= width*0.5:
				pic.set_pixel(x,y,Color(COLORS[color]))

func run(api, image, project, params):
	var pic = Image.create(W,H,false,Image.FORMAT_RGBA8)
	pic.fill(Color(0,0,0,0))
	match int(params.role):
		0:
			# Compact contact shadows face down-right; no cast pedestal.
			disk(pic,20.5,20.5,13,"shadow")
			capsule(pic,46,15,30,12,"shadow")
			disk(pic,100.5,21.5,14,"shadow")
		1:
			disk(pic,19.5,19.5,13,"outline")
			capsule(pic,45,14,30,12,"outline")
		2:
			disk(pic,19.5,19.5,12,"roseShade")
			disk(pic,18.5,18.5,11,"rose")
			capsule(pic,46,15,28,10,"rose")
			capsule(pic,46,15,27,8,"roseLight")
		3:
			# Sparse broad clusters read as uncooked ground meat, not grain noise.
			rect(pic,14,10,7,2,"roseLight")
			rect(pic,11,12,4,3,"roseLight")
			rect(pic,10,15,2,5,"roseLight")
			rect(pic,15,17,3,2,"rosePale")
			rect(pic,23,13,2,3,"rosePale")
			rect(pic,23,24,3,2,"roseLight")
			rect(pic,13,25,2,2,"roseLight")
			# One smooth longitudinal highlight, rounded sausage ends.
			rect(pic,51,16,16,2,"rosePale")
			rect(pic,48,18,2,2,"rosePale")
		4:
			disk(pic,99.5,19.5,14,"outline")
			disk(pic,99.5,19.5,13,"metal")
			disk(pic,98.5,18.5,12,"metalLight")
			disk(pic,99.5,19.5,11,"metalDark")
		5:
			disk(pic,99.5,19.5,10,"table")
			disk(pic,98.5,18.5,9,"tableLight")
			# A single restrained batter fold away from the utensil.
			rect(pic,94,25,7,1,"table")
			rect(pic,92,23,2,2,"table")
		6:
			# One connected steel ladle lies diagonally across the rim.
			diagonal(pic,102,18,114,6,4,"outline")
			diagonal(pic,102,18,114,6,2,"metalLight")
			disk(pic,101,20,4.5,"outline")
			disk(pic,101,20,3.5,"metal")
			disk(pic,100,19,2.5,"metalLight")
			disk(pic,101,20,2,"table")
		7:
			rect(pic,94,7,8,1,"glint")
			rect(pic,89,11,1,5,"glint")
			rect(pic,111,8,2,1,"glint")
	return pic
