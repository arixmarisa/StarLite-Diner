const W = 20
const H = 34
const O = "#322c38"
const S = "#46404b"
const D = "#676c70"
const M = "#9ba8a5"
const L = "#d5dfd3"
const G = "#fff0d5"
const R = "#ee75a3"
const RD = "#9f385e"

func rect(picture,x,y,w,h,color):
	picture.fill_rect(Rect2i(x,y,w,h),Color(color))

func run(api,image,project,params):
	var picture = Image.create(W,H,false,Image.FORMAT_RGBA8)
	picture.fill(Color(0,0,0,0))
	match int(params.role):
		0:
			rect(picture,3,29,15,3,S)
			rect(picture,4,32,13,1,S)
		1:
			# Native compact stand and shallow base inside the 16x8 attachment area.
			rect(picture,5,7,4,20,O)
			rect(picture,6,8,2,17,M)
			rect(picture,6,9,1,15,L)
			rect(picture,4,24,12,7,O)
			rect(picture,3,25,14,5,O)
			rect(picture,2,27,16,2,O)
			rect(picture,4,25,11,4,M)
			rect(picture,3,27,14,2,M)
			rect(picture,4,25,10,1,L)
			rect(picture,3,27,1,2,L)
			rect(picture,5,29,10,1,D)
			rect(picture,6,30,8,1,O)
		2:
			# Recognizable motor head, small rose band and attached lower collar.
			rect(picture,7,2,9,8,O)
			rect(picture,5,3,13,6,O)
			rect(picture,6,3,11,5,M)
			rect(picture,7,3,8,4,L)
			rect(picture,7,3,7,1,G)
			rect(picture,16,4,1,4,D)
			rect(picture,7,8,9,1,R)
			rect(picture,8,9,7,1,RD)
			rect(picture,10,10,4,1,O)
		3:
			rect(picture,11,10,3,10,O)
			rect(picture,12,11,1,8,L)
			rect(picture,10,19,5,2,D)
		4:
			# Short open steel cup with taper, one-pixel handle loop and broad lip.
			rect(picture,16,19,3,6,O)
			rect(picture,17,20,1,4,L)
			rect(picture,8,18,10,5,O)
			rect(picture,9,22,8,4,O)
			rect(picture,10,25,6,2,O)
			rect(picture,9,19,8,3,M)
			rect(picture,10,22,6,3,M)
			rect(picture,10,19,1,3,L)
			rect(picture,11,22,1,2,L)
			rect(picture,16,20,1,2,D)
			rect(picture,15,23,1,2,D)
			rect(picture,9,17,8,3,O)
			rect(picture,8,18,10,2,O)
			rect(picture,9,18,8,1,L)
			rect(picture,10,19,6,1,D)
		5:
			rect(picture,4,4,2,3,O)
			rect(picture,4,4,1,2,L)
			rect(picture,8,4,2,1,G)
			rect(picture,9,18,3,1,G)
			rect(picture,10,21,1,1,G)
	return picture
