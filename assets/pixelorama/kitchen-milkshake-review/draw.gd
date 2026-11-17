const W = 24
const H = 48
const O = "#322c38"
const S = "#46404b"
const D = "#676c70"
const M = "#9ba8a5"
const L = "#d5dfd3"
const G = "#fff0d5"
const R = "#ee75a3"
const RD = "#9f385e"

func rect(picture, x, y, w, h, color):
	picture.fill_rect(Rect2i(x,y,w,h),Color(color))

func run(api, image, project, params):
	var picture = Image.create(W,H,false,Image.FORMAT_RGBA8)
	picture.fill(Color(0,0,0,0))
	match int(params.role):
		0:
			rect(picture,4,40,18,4,S)
			rect(picture,3,41,20,2,S)
		1:
			# Upright rear column, then a shallow stepped oval base.
			rect(picture,6,10,5,28,O)
			rect(picture,7,11,3,25,M)
			rect(picture,7,12,1,22,L)
			rect(picture,9,13,1,22,D)
			rect(picture,5,33,14,10,O)
			rect(picture,3,35,18,6,O)
			rect(picture,2,37,20,3,O)
			rect(picture,5,34,13,7,M)
			rect(picture,4,36,16,4,M)
			rect(picture,3,37,18,2,M)
			rect(picture,5,34,12,1,L)
			rect(picture,4,35,3,1,L)
			rect(picture,3,37,1,2,L)
			rect(picture,5,40,14,2,D)
			rect(picture,7,42,10,1,O)
		2:
			# Motor housing with the established rose accent rather than plastic shading.
			rect(picture,8,3,10,12,O)
			rect(picture,6,5,14,8,O)
			rect(picture,7,5,12,7,M)
			rect(picture,8,4,9,8,L)
			rect(picture,8,4,8,1,G)
			rect(picture,7,6,1,3,G)
			rect(picture,18,6,1,5,D)
			rect(picture,8,11,10,2,R)
			rect(picture,8,13,10,1,RD)
			rect(picture,11,14,6,2,O)
		3:
			rect(picture,13,15,3,13,O)
			rect(picture,14,15,1,12,L)
			rect(picture,12,26,5,2,D)
		4:
			# Open steel mixing cup, tapered body and a right-side handle loop.
			rect(picture,19,26,4,8,O)
			rect(picture,20,27,2,6,L)
			rect(picture,20,28,1,4,O)
			rect(picture,10,24,11,7,O)
			rect(picture,11,29,9,6,O)
			rect(picture,12,34,7,3,O)
			rect(picture,11,25,9,5,M)
			rect(picture,12,30,7,4,M)
			rect(picture,13,34,5,2,D)
			rect(picture,11,25,2,5,L)
			rect(picture,12,30,2,3,L)
			rect(picture,18,26,2,4,D)
			rect(picture,17,30,2,4,D)
			rect(picture,11,22,9,5,O)
			rect(picture,10,23,11,3,O)
			rect(picture,11,23,9,3,L)
			rect(picture,12,24,7,1,D)
			rect(picture,13,24,2,1,S)
		5:
			# Compact mechanical control and hard upper-left reflections.
			rect(picture,5,7,2,4,O)
			rect(picture,5,7,1,2,L)
			rect(picture,9,6,2,1,G)
			rect(picture,11,23,4,1,G)
			rect(picture,12,27,1,2,G)
	return picture
