const W = 48
const H = 72
func run(api, image, project, params):
	var output = Image.create(W, H, false, Image.FORMAT_RGBA8)
	output.fill(Color(0, 0, 0, 0))
	for item in params.rectangles:
		var rect = Rect2i(int(item.x), int(item.y), int(item.w), int(item.h))
		var color = Color(str(item.color))
		var radius = int(item.radius)
		if radius == 0:
			output.fill_rect(rect, color)
		else:
			output.fill_rect(Rect2i(rect.position.x + radius, rect.position.y, rect.size.x - radius * 2, rect.size.y), color)
			output.fill_rect(Rect2i(rect.position.x, rect.position.y + radius, rect.size.x, rect.size.y - radius * 2), color)
			if radius == 2:
				output.fill_rect(Rect2i(rect.position.x + 1, rect.position.y + 1, rect.size.x - 2, rect.size.y - 2), color)
	return output
