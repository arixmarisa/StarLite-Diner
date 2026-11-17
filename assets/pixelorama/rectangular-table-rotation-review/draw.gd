const W = 48
const H = 48
const C = ["#322c38", "#46404b", "#676c70", "#9ba8a5", "#d5dfd3", "#fff0d5", "#9f385e", "#c94d7b", "#ee75a3", "#ffacc9", "#ffd2de", "#a6bcb2", "#f1e5d1", "#fff5df"]

func rounded(output, x, y, w, h, color, radius = 1):
	var rect = Rect2i(x, y, w, h)
	output.fill_rect(Rect2i(x + radius, y, w - radius * 2, h), Color(C[color]))
	output.fill_rect(Rect2i(x, y + radius, w, h - radius * 2), Color(C[color]))
	if radius == 2:
		output.fill_rect(Rect2i(x + 1, y + 1, w - 2, h - 2), Color(C[color]))

func box(output, x, y, w, h, color):
	output.fill_rect(Rect2i(x, y, w, h), Color(C[color]))

func run(api, image, project, params):
	var output = Image.create(W, H, false, Image.FORMAT_RGBA8)
	output.fill(Color(0, 0, 0, 0))
	var role = int(params.role)
	if role == 0:
		rounded(output, 15, 38, 20, 4, 1, 1)
	elif role == 1:
		box(output, 22, 26, 4, 10, 0)
		box(output, 23, 26, 2, 10, 3)
		rounded(output, 18, 35, 12, 6, 0, 1)
		box(output, 19, 36, 10, 4, 3)
	elif role == 2:
		rounded(output, 6, 4, 35, 30, 0, 2)
		box(output, 8, 31, 31, 2, 2)
	elif role == 3:
		rounded(output, 7, 5, 33, 26, 11, 1)
		rounded(output, 8, 6, 31, 24, 12, 1)
	elif role == 4:
		box(output, 9, 6, 29, 1, 13)
		box(output, 8, 8, 1, 20, 13)
		box(output, 23, 34, 1, 2, 4)
		box(output, 19, 36, 10, 1, 4)
	return output
