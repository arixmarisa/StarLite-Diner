const W = 48
const H = 32

func box(pic,x,y,w,h,color):
	pic.fill_rect(Rect2i(x,y,w,h),Color(color))

func rounded(pic,x,y,w,h,color):
	box(pic,x+1,y,w-2,h,color)
	box(pic,x,y+1,w,h-2,color)

func line(pic,a,b,color,radius=0):
	var x = int(a[0])
	var y = int(a[1])
	var bx = int(b[0])
	var by = int(b[1])
	var dx = abs(bx-x)
	var sx = 1 if x<bx else -1
	var dy = -abs(by-y)
	var sy = 1 if y<by else -1
	var error = dx+dy
	while true:
		box(pic,x-radius,y-radius,radius*2+1,radius*2+1,color)
		if x==bx and y==by:
			break
		var twice = error*2
		if twice>=dy:
			error += dy
			x += sx
		if twice<=dx:
			error += dx
			y += sy

func run(api,image,project,params):
	var pic = Image.create(W,H,false,Image.FORMAT_RGBA8)
	pic.fill(Color(0,0,0,0))
	var role = int(params.role)
	var outline = "#322c38"
	var shadow = "#46404b"
	var dark = "#676c70"
	var steel = "#9ba8a5"
	var light = "#d5dfd3"
	if role == 0:
		# Exact eighteen-pixel counter surface profile, forty pixels wide.
		box(pic,4,10,40,1,outline)
		box(pic,4,11,40,1,light)
		box(pic,4,12,40,13,steel)
		box(pic,4,25,40,1,light)
		box(pic,4,26,40,1,dark)
		box(pic,4,27,40,1,outline)
		rounded(pic,7,13,23,13,outline)
		rounded(pic,8,14,21,11,light)
		rounded(pic,31,13,11,13,dark)
		box(pic,32,14,9,11,steel)
	elif role == 1:
		rounded(pic,9,15,19,9,dark)
		box(pic,10,16,17,2,shadow)
		box(pic,10,18,2,5,shadow)
		box(pic,12,18,14,5,dark)
		box(pic,12,23,14,1,steel)
		box(pic,27,18,1,5,steel)
	elif role == 2:
		for yy in [16,19,22]:
			box(pic,33,yy,7,1,light)
			box(pic,33,yy+1,7,1,dark)
		box(pic,31,14,1,11,outline)
	elif role == 3:
		rounded(pic,13,12,14,3,outline)
		box(pic,14,12,12,2,dark)
		box(pic,15,12,10,1,light)
		var points = [[16,13],[16,8],[17,5],[19,4],[21,4],[23,5],[24,7],[24,11]]
		for index in range(points.size()-1):
			line(pic,points[index],points[index+1],outline,1)
		for index in range(points.size()-1):
			line(pic,points[index],points[index+1],light)
		box(pic,24,8,1,3,steel)
		box(pic,23,11,3,1,outline)
		box(pic,24,10,1,1,steel)
		box(pic,14,12,2,2,"#c94d7b")
		box(pic,14,12,1,1,"#ffacc9")
	elif role == 4:
		box(pic,9,14,4,1,light)
		box(pic,27,14,1,1,light)
		box(pic,8,15,1,9,light)
		box(pic,10,25,18,1,dark)
		rounded(pic,18,20,4,3,outline)
		box(pic,19,21,2,1,steel)
		box(pic,32,14,9,1,light)
	return pic
