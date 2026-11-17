const W = 20
const H = 14

func row(picture, x, y, width, color):
	picture.fill_rect(Rect2i(x,y,width,1),Color(color))

func silhouette(picture, offset, color):
	var widths = [6,12,14,16,16,16,14,12,6]
	for index in range(widths.size()):
		row(picture,(W-widths[index])/2+offset.x,2+index+offset.y,widths[index],color)

func run(api,image,project,params):
	var picture = Image.create(W,H,false,Image.FORMAT_RGBA8)
	picture.fill(Color(0,0,0,0))
	var role = int(params.role)
	if role == 0:
		silhouette(picture,Vector2i(1,2),"#46404b")
	elif role == 1:
		silhouette(picture,Vector2i(0,1),"#322c38")
		silhouette(picture,Vector2i.ZERO,"#322c38")
		var widths = [4,10,12,14,14,14,12,10,4]
		for index in range(widths.size()):
			row(picture,(W-widths[index])/2,2+index,widths[index],"#9ba8a5")
		row(picture,6,10,8,"#676c70")
	elif role == 2:
		var widths = [6,10,12,12,10,6]
		for index in range(widths.size()):
			row(picture,(W-widths[index])/2,4+index,widths[index],"#676c70")
		row(picture,6,5,5,"#9ba8a5")
	elif role == 3:
		row(picture,7,2,6,"#d5dfd3")
		row(picture,4,3,4,"#d5dfd3")
		row(picture,3,4,2,"#d5dfd3")
		row(picture,2,5,2,"#d5dfd3")
		row(picture,7,2,2,"#fff0d5")
		row(picture,4,3,1,"#fff0d5")
		row(picture,3,6,1,"#d5dfd3")
	return picture
