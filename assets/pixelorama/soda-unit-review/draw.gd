const W = 32
const H = 40
const COLORS = ["#322c38", "#46404b", "#676c70", "#9ba8a5", "#d5dfd3", "#fff0d5", "#9f385e", "#c94d7b", "#ee75a3", "#ffacc9", "#ffd2de", "#a6bcb2", "#f1e5d1", "#fff5df"]

func box(output, x, y, width, height, color, radius = 0):
	var fill = Color(COLORS[color])
	if radius == 0:
		output.fill_rect(Rect2i(x, y, width, height), fill)
	else:
		output.fill_rect(Rect2i(x + radius, y, width - radius * 2, height), fill)
		output.fill_rect(Rect2i(x, y + radius, width, height - radius * 2), fill)
		if radius == 2:
			output.fill_rect(Rect2i(x + 1, y + 1, width - 2, height - 2), fill)

func run(api, image, project, params):
	var output = Image.create(W, H, false, Image.FORMAT_RGBA8)
	output.fill(Color(0, 0, 0, 0))
	var role = int(params.role)
	if role == 0:
		box(output, 3, 35, 27, 4, 1, 2)
	elif role == 1:
		box(output, 2, 2, 28, 34, 0, 2)
		box(output, 3, 4, 26, 29, 2, 1)
		box(output, 4, 4, 24, 25, 3)
		box(output, 5, 14, 22, 14, 0)
		box(output, 6, 15, 20, 12, 1)
		box(output, 7, 16, 18, 10, 2)
		box(output, 3, 31, 26, 4, 7)
		box(output, 4, 32, 24, 2, 8)
		box(output, 4, 35, 4, 2, 0)
		box(output, 24, 35, 4, 2, 0)
	elif role == 2:
		box(output, 3, 3, 26, 11, 0, 1)
		box(output, 4, 3, 24, 3, 11)
		box(output, 5, 4, 22, 7, 12)
		box(output, 5, 4, 22, 1, 13)
		box(output, 4, 11, 24, 2, 7)
		box(output, 5, 11, 22, 1, 8)
	elif role == 3:
		for tap_x in [7, 14, 21]:
			box(output, tap_x, 14, 4, 7, 0, 1)
			box(output, tap_x + 1, 15, 2, 4, 8)
			box(output, tap_x + 1, 15, 2, 1, 10)
			box(output, tap_x + 1, 19, 2, 3, 3)
			box(output, tap_x + 1, 21, 3, 2, 0)
			box(output, tap_x + 1, 21, 2, 1, 4)
			box(output, tap_x + 2, 22, 2, 2, 0)
			box(output, tap_x + 2, 22, 1, 1, 3)
		box(output, 3, 27, 26, 5, 0, 1)
		box(output, 4, 27, 24, 3, 3)
		box(output, 5, 28, 22, 2, 2)
		for grid_x in range(6, 27, 3):
			box(output, grid_x, 28, 1, 2, 4)
		box(output, 4, 30, 24, 1, 4)
	elif role == 4:
		box(output, 3, 5, 1, 21, 4)
		box(output, 28, 5, 1, 21, 2)
		box(output, 5, 13, 22, 1, 4)
		box(output, 5, 32, 22, 1, 9)
	return output
