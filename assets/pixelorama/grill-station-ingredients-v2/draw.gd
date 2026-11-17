const W = 36
const H = 10
const COLORS = {"O":"#322c38","S":"#46404b","D":"#676c70","M":"#9ba8a5","L":"#d5dfd3","G":"#fff0d5","r":"#c94d7b","P":"#ee75a3","p":"#ffacc9","F":"#ffd2de","C":"#f1e5d1","c":"#fff5df"}

func bar(pic,x,y,width,color):
	pic.fill_rect(Rect2i(x,y,width,1),Color(COLORS[color]))

func run(api,image,project,params):
	var pic = Image.create(W,H,false,Image.FORMAT_RGBA8)
	pic.fill(Color(0,0,0,0))
	match int(params.role):
		0:
			bar(pic,4,7,5,"S")
			bar(pic,15,7,7,"S")
			bar(pic,28,9,5,"S")
		1:
			# Native7x5 oblique patty contour, independent of the old40px art.
			bar(pic,4,3,3,"O")
			bar(pic,2,4,7,"O")
			bar(pic,2,5,7,"O")
			bar(pic,2,6,7,"O")
			bar(pic,4,7,3,"O")
			# Native10x3 smooth sausage capsule.
			bar(pic,14,4,8,"O")
			bar(pic,13,5,10,"O")
			bar(pic,14,6,8,"O")
		2:
			bar(pic,3,4,5,"p")
			bar(pic,3,5,5,"P")
			bar(pic,3,6,5,"r")
			bar(pic,5,5,1,"F")
			bar(pic,14,5,8,"P")
			bar(pic,14,5,5,"p")
			bar(pic,21,5,1,"r")
		3:
			# Eight-pixel bowl: upper oval rim and short shaded front.
			bar(pic,28,3,4,"O")
			bar(pic,26,4,8,"O")
			bar(pic,27,4,6,"L")
			bar(pic,26,5,8,"O")
			bar(pic,27,5,6,"M")
			bar(pic,27,6,6,"O")
			bar(pic,28,6,4,"D")
			bar(pic,27,7,6,"O")
			bar(pic,28,7,4,"M")
			bar(pic,28,8,4,"O")
		4:
			bar(pic,28,4,4,"c")
			bar(pic,28,5,4,"C")
		5:
			# Connected ladle, bowl resting in batter and handle up-right.
			bar(pic,34,0,1,"O")
			bar(pic,33,1,3,"O")
			bar(pic,34,1,1,"L")
			bar(pic,32,2,3,"O")
			bar(pic,33,2,1,"L")
			bar(pic,31,3,3,"O")
			bar(pic,32,3,1,"L")
			bar(pic,30,4,3,"O")
			bar(pic,31,4,1,"L")
			bar(pic,29,5,3,"O")
			bar(pic,30,5,1,"C")
			bar(pic,30,6,1,"O")
	return pic
