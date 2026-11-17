func run(api, image, project, params):
	var spec = params.spec
	var out = Image.create(int(spec.width), int(spec.height), false, Image.FORMAT_RGBA8)
	out.fill(Color(0,0,0,0))
	for command in spec.rectangles[int(params.role)]:
		out.fill_rect(Rect2i(int(command.x),int(command.y),int(command.w),int(command.h)),Color(str(command.color)))
	return out
