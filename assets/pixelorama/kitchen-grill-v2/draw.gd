const W = 96
const H = 58

func rect(pic, x, y, w, h, color):
	pic.fill_rect(Rect2i(x, y, w, h), Color(color))

func run(api, image, project, params):
	var pic = Image.create(W, H, false, Image.FORMAT_RGBA8)
	pic.fill(Color(0, 0, 0, 0))
	var role = int(params.role)
	if role == 0:
		rect(pic, 2, 56, 94, 2, "#46404b")
	if role == 1:
		# Surface and face share the kit's native 24 + 16 pixel profile.
		rect(pic, 0, 16, 96, 24, "#9ba8a5")
		rect(pic, 0, 16, 96, 1, "#322c38")
		rect(pic, 0, 17, 96, 1, "#d5dfd3")
		rect(pic, 0, 37, 96, 1, "#d5dfd3")
		rect(pic, 0, 39, 96, 1, "#322c38")
		rect(pic, 0, 40, 96, 16, "#676c70")
		rect(pic, 0, 40, 96, 1, "#322c38")
		rect(pic, 0, 41, 96, 1, "#d5dfd3")
		rect(pic, 0, 42, 96, 1, "#9ba8a5")
		rect(pic, 0, 43, 96, 1, "#322c38")
		rect(pic, 0, 54, 96, 2, "#322c38")
		rect(pic, 0, 18, 1, 36, "#322c38")
	if role == 2:
		rect(pic, 1, 11, 94, 5, "#322c38")
		rect(pic, 2, 12, 92, 1, "#d5dfd3")
		rect(pic, 2, 13, 92, 2, "#9ba8a5")
		rect(pic, 3, 13, 28, 1, "#d5dfd3")
		rect(pic, 91, 13, 3, 2, "#676c70")
	if role == 3:
		rect(pic, 4, 18, 87, 19, "#322c38")
		rect(pic, 5, 19, 85, 17, "#676c70")
		rect(pic, 5, 19, 85, 1, "#46404b")
		rect(pic, 5, 20, 1, 15, "#46404b")
		rect(pic, 6, 35, 83, 1, "#9ba8a5")
	if role == 4:
		rect(pic, 4, 37, 87, 2, "#322c38")
		rect(pic, 5, 37, 85, 1, "#46404b")
		rect(pic, 6, 38, 83, 1, "#676c70")
	if role == 5:
		for x in [9, 29, 49, 69]:
			rect(pic, x, 44, 5, 4, "#322c38")
			rect(pic, x+1, 44, 3, 1, "#d5dfd3")
			rect(pic, x+1, 45, 3, 2, "#9ba8a5")
			rect(pic, x+2, 45, 1, 1, "#322c38")
		rect(pic, 4, 49, 87, 1, "#46404b")
		rect(pic, 47, 50, 1, 4, "#322c38")
		rect(pic, 17, 50, 18, 2, "#322c38")
		rect(pic, 18, 50, 16, 1, "#d5dfd3")
		rect(pic, 60, 50, 18, 2, "#322c38")
		rect(pic, 61, 50, 16, 1, "#d5dfd3")
		rect(pic, 84, 44, 5, 4, "#322c38")
		rect(pic, 85, 45, 3, 2, "#ee75a3")
	if role == 6:
		rect(pic, 2, 19, 1, 17, "#d5dfd3")
		rect(pic, 92, 19, 1, 16, "#676c70")
		rect(pic, 5, 52, 8, 1, "#9ba8a5")
		rect(pic, 50, 52, 8, 1, "#9ba8a5")
	return pic
