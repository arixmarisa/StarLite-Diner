const WIDTH = 24
const HEIGHT = 48

func run(api, image, project, params):
	var output = Image.create(WIDTH, HEIGHT, false, Image.FORMAT_RGBA8)
	output.fill(Color.TRANSPARENT)
	var source = Image.load_from_file(str(params.reference_dir).path_join("counter-vertical.png"))
	var front = Image.load_from_file(str(params.reference_dir).path_join("counter-front.png"))
	var role = int(params.role)
	if role == 0:
		for y in range(32):
			for x in range(21):
				output.set_pixel(x, y, source.get_pixel(x, y % 16))
	elif role == 1:
		for y in range(32):
			for x in range(21, 24):
				output.set_pixel(x, y, source.get_pixel(x, y % 16))
		for y in range(4):
			for x in range(24):
				output.set_pixel(x, y + 32, front.get_pixel(8, y))
	elif role == 2:
		for y in range(4, 12):
			for x in range(24):
				var source_x = 0 if x == 0 else (15 if x == 23 else 8)
				output.set_pixel(x, y + 32, front.get_pixel(source_x, y))
	elif role == 3:
		for y in range(12, 16):
			for x in range(24):
				output.set_pixel(x, y + 32, front.get_pixel(8, y))
	return output
