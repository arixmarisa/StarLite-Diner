const W = 24
const H = 16

func row(picture, x, y, width, color):
	picture.fill_rect(Rect2i(x, y, width, 1), Color(color))

func silhouette(picture, offset, color):
	var widths = [8,14,18,20,20,20,20,18,14,8]
	for index in range(widths.size()):
		row(picture, (W-widths[index])/2+offset.x, 2+index+offset.y, widths[index], color)

func run(api, image, project, params):
	var picture = Image.create(W,H,false,Image.FORMAT_RGBA8)
	picture.fill(Color(0,0,0,0))
	var role = int(params.role)
	if role == 0:
		silhouette(picture,Vector2i(1,2),"#46404b")
	elif role == 1:
		silhouette(picture,Vector2i(0,1),"#322c38")
		silhouette(picture,Vector2i.ZERO,"#322c38")
		var widths = [6,12,16,18,18,18,18,16,12,6]
		for index in range(widths.size()):
			row(picture,(W-widths[index])/2,2+index,widths[index],"#9ba8a5")
		row(picture,6,11,12,"#676c70")
	elif role == 2:
		var widths = [8,14,16,16,14,8]
		for index in range(widths.size()):
			row(picture,(W-widths[index])/2,4+index,widths[index],"#676c70")
		row(picture,7,5,6,"#9ba8a5")
	elif role == 3:
		row(picture,8,2,8,"#d5dfd3")
		row(picture,5,3,5,"#d5dfd3")
		row(picture,3,4,3,"#d5dfd3")
		row(picture,2,5,2,"#d5dfd3")
		row(picture,8,2,3,"#fff0d5")
		row(picture,5,3,2,"#fff0d5")
		row(picture,3,6,1,"#d5dfd3")
	return picture
