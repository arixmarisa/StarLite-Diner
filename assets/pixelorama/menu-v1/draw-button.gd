# Pixelorama MCP eval_gdscript recipe. Run once per role (0..3) and frame (0..2).
# params.role selects the layer; params.state is rest/highlight/pressed = 0/1/2.
func panel(img: Image, x: int, y: int, w: int, h: int, color: String, corner: int = 2):
	img.fill_rect(Rect2i(x + corner, y, w - corner * 2, h), Color(color))
	img.fill_rect(Rect2i(x, y + corner, w, h - corner * 2), Color(color))
	if corner > 1:
		img.fill_rect(Rect2i(x + 1, y + 1, w - 2, h - 2), Color(color))

func stripe(img: Image, x: int, y: int, w: int, h: int, color: String):
	img.fill_rect(Rect2i(x, y, w, h), Color(color))

func run(api, image: Image, project, params: Dictionary):
	var img = api.create_image(96, 28)
	img.fill(Color.TRANSPARENT)
	var state = int(params.state)
	var role = int(params.role)
	var pressed = state == 2
	var highlighted = state == 1
	var shift = 1 if pressed else 0
	if role == 0:
		panel(img, 3, 4, 91, 22, "#322c38", 3)
		panel(img, 2, 1, 92, 24, "#fff0d5" if highlighted else "#322c38", 3)
	elif role == 1:
		panel(img, 3, 2, 90, 22, "#676c70", 3)
		panel(img, 4, 2, 88, 21, "#d5dfd3", 2)
		stripe(img, 7, 2, 81, 1, "#fff5df")
		stripe(img, 5, 3, 84, 1, "#fff0d5")
		stripe(img, 4, 5, 1, 15, "#fff0d5")
		stripe(img, 91, 5, 1, 16, "#9ba8a5")
		stripe(img, 6, 22, 83, 1, "#9ba8a5")
		stripe(img, 8, 23, 79, 1, "#676c70")
		stripe(img, 7, 4, 15, 1, "#fff5df")
		stripe(img, 24, 4, 4, 1, "#fff5df")
	elif role == 2:
		panel(img, 6, 5, 84, 16 + shift, "#322c38", 1)
		panel(img, 7, 6 + shift, 82, 14, "#ffacc9" if highlighted else "#ee75a3", 1)
		stripe(img, 9, 6 + shift, 78, 1, "#ffd2de" if not pressed else "#c94d7b")
		stripe(img, 8, 7 + shift, 80, 1, "#ffacc9" if not pressed else "#ee75a3")
		stripe(img, 8, 18 + shift, 80, 1, "#ee75a3" if highlighted else "#c94d7b")
		stripe(img, 9, 19 + shift, 78, 1, "#c94d7b" if highlighted else "#9f385e")
		stripe(img, 11, 12 + shift, 9, 1, "#fff0d5" if highlighted else "#ffd2de")
		stripe(img, 12, 13 + shift, 8, 1, "#c94d7b")
		stripe(img, 76, 12 + shift, 9, 1, "#fff0d5" if highlighted else "#ffd2de")
		stripe(img, 76, 13 + shift, 8, 1, "#c94d7b")
	elif role == 3:
		var glyphs = {
			"S": ["01111", "11000", "11000", "01110", "00011", "00011", "11110"],
			"T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
			"A": ["01110", "11011", "11011", "11111", "11011", "11011", "11011"],
			"R": ["11110", "11011", "11011", "11110", "11100", "11010", "11011"]
		}
		var points: Array[Vector2i] = []
		var label = "START"
		for i in range(label.length()):
			var rows = glyphs[label[i]]
			for y in range(7):
				for x in range(5):
					if rows[y][x] == "1":
						points.append(Vector2i(31 + i * 7 + x, 9 + shift + y))
		for p in points:
			for dy in range(-1, 2):
				for dx in range(-1, 2):
					img.set_pixelv(p + Vector2i(dx, dy), Color("#322c38"))
		for p in points:
			img.set_pixelv(p, Color("#fff5df" if p.y < 12 + shift else "#f1e5d1"))
	return img
