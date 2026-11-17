const W = 24
const H = 12
const C = {"O":"#322c38","S":"#46404b","D":"#676c70","M":"#9ba8a5","L":"#d5dfd3","p":"#ffacc9","P":"#ee75a3","r":"#c94d7b","F":"#ffd2de","b":"#f1e5d1","B":"#fff5df"}

func bar(pic,x,y,w,c):
	pic.fill_rect(Rect2i(x,y,w,1),Color(C[c]))

func run(api,image,project,params):
	var pic=Image.create(W,H,false,Image.FORMAT_RGBA8)
	pic.fill(Color.TRANSPARENT)
	match int(params.role):
		0:
			bar(pic,2,11,4,"S")
			bar(pic,10,11,4,"S")
			bar(pic,19,11,3,"S")
		1:
			# Three overlapping rounded patties, each with its own near edge.
			for yy in [1,4,7]:
				bar(pic,2,yy,4,"O")
				bar(pic,1,yy+1,6,"O")
				bar(pic,1,yy+2,6,"O")
				bar(pic,2,yy+3,4,"O")
			# Three individual horizontal sausages with rounded end caps.
			for yy in [2,5,8]:
				bar(pic,10,yy,4,"O")
				bar(pic,9,yy+1,6,"O")
				bar(pic,10,yy+2,4,"O")
		2:
			for yy in [1,4,7]:
				bar(pic,2,yy+1,4,"p")
				bar(pic,2,yy+2,4,"r")
				bar(pic,2,yy+1,1,"F")
				bar(pic,4,yy+2,2,"P")
			for yy in [2,5,8]:
				bar(pic,10,yy+1,4,"P")
				bar(pic,10,yy+1,2,"p")
		3:
			# One compact steel bowl; six native pixels across its widest rim.
			bar(pic,18,5,4,"O")
			bar(pic,17,6,6,"O")
			bar(pic,18,6,4,"L")
			bar(pic,17,7,6,"O")
			bar(pic,18,7,4,"M")
			bar(pic,18,8,4,"O")
			bar(pic,19,8,2,"M")
			bar(pic,18,9,4,"O")
			bar(pic,19,9,2,"D")
			bar(pic,19,10,2,"O")
		4:
			bar(pic,18,6,3,"B")
			bar(pic,18,7,3,"b")
		5:
			# Connected ladle, retaining the up-right handle at native density.
			bar(pic,22,1,1,"O")
			bar(pic,21,2,2,"O")
			bar(pic,21,2,1,"L")
			bar(pic,20,3,2,"O")
			bar(pic,20,3,1,"L")
			bar(pic,19,4,2,"O")
			bar(pic,19,4,1,"L")
			bar(pic,19,5,1,"O")
			bar(pic,18,6,3,"O")
			bar(pic,19,6,1,"b")
	return pic
