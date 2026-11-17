const W = 56
const H = 40

func rect(output, x, y, width, height, color):
	output.fill_rect(Rect2i(x, y, width, height), Color(color))

func rounded(output, x, y, width, height, color, radius = 1):
	var ink = Color(color)
	output.fill_rect(Rect2i(x + radius, y, width - radius * 2, height), ink)
	output.fill_rect(Rect2i(x, y + radius, width, height - radius * 2), ink)
	if radius == 2:
		output.fill_rect(Rect2i(x + 1, y + 1, width - 2, height - 2), ink)

func line(output, a, b, color, radius = 0):
	var x = int(a[0])
	var y = int(a[1])
	var bx = int(b[0])
	var by = int(b[1])
	var dx = abs(bx - x)
	var sx = 1 if x < bx else -1
	var dy = -abs(by - y)
	var sy = 1 if y < by else -1
	var error = dx + dy
	while true:
		output.fill_rect(Rect2i(x - radius, y - radius, radius * 2 + 1, radius * 2 + 1), Color(color))
		if x == bx and y == by:
			break
		var twice = error * 2
		if twice >= dy:
			error += dy
			x += sx
		if twice <= dx:
			error += dx
			y += sy

func path(output, points, color, radius = 0):
	for index in range(points.size() - 1):
		line(output, points[index], points[index + 1], color, radius)

func run(api, image, project, params):
	var output = Image.create(W, H, false, Image.FORMAT_RGBA8)
	output.fill(Color(0, 0, 0, 0))
	var role = int(params.role)
	var outline = "#322c38"
	var shadow = "#46404b"
	var dark = "#676c70"
	var steel = "#9ba8a5"
	var light = "#d5dfd3"
	if role == 0:
		# Exact approved-counter top profile,48x24,at(4,12).
		rect(output, 4, 12, 48, 1, outline)
		rect(output, 4, 13, 48, 1, light)
		rect(output, 4, 14, 48, 19, steel)
		rect(output, 4, 33, 48, 1, light)
		rect(output, 4, 34, 48, 1, steel)
		rect(output, 4, 35, 48, 1, outline)
		# Bowl and drainer mounting lip, inside the shared edge profile.
		rounded(output, 7, 16, 27, 17, outline, 2)
		rounded(output, 8, 17, 25, 15, light, 1)
		rounded(output, 36, 17, 13, 16, dark, 1)
		rect(output, 37, 18, 11, 14, steel)
	elif role == 1:
		# Basin recess: rear/left walls stay darker than the floor.
		rounded(output, 9, 18, 23, 13, dark, 1)
		rect(output, 10, 19, 21, 3, shadow)
		rect(output, 10, 22, 2, 7, shadow)
		rect(output, 12, 22, 18, 7, dark)
		rect(output, 12, 29, 18, 1, steel)
		rect(output, 30, 22, 1, 7, steel)
		rect(output, 11, 28, 1, 1, steel)
	elif role == 2:
		# Short,regular rib clusters imply a draining board,not random noise.
		for row in [20, 23, 26, 29]:
			rect(output, 38, row, 9, 1, light)
			rect(output, 38, row + 1, 9, 1, dark)
		rect(output, 36, 18, 1, 13, outline)
		rect(output, 48, 19, 1, 12, light)
	elif role == 3:
		# Escutcheon,curved dry faucet and one small rose hot-water control.
		rounded(output, 15, 14, 16, 3, outline, 1)
		rect(output, 16, 14, 14, 2, dark)
		rect(output, 17, 14, 12, 1, light)
		var points = [[19,15],[19,9],[20,7],[22,6],[24,6],[26,7],[27,9],[27,13]]
		path(output, points, outline, 1)
		path(output, points, light)
		rect(output, 27, 10, 1, 3, steel)
		rect(output, 26, 13, 3, 1, outline)
		rect(output, 27, 12, 1, 1, steel)
		rect(output, 16, 14, 2, 2, "#c94d7b")
		rect(output, 16, 14, 1, 1, "#ffacc9")
	elif role == 4:
		# Small hard reflections and recessed drain,all fully opaque.
		rect(output, 9, 17, 22, 1, light)
		rect(output, 8, 18, 1, 12, light)
		rect(output, 10, 31, 21, 1, dark)
		rounded(output, 21, 25, 4, 3, outline, 1)
		rect(output, 22, 26, 2, 1, steel)
		rect(output, 37, 18, 10, 1, light)
	return output
