func run(api, image, project, params):
	var target = Image.create(int(params.width), int(params.height), false, Image.FORMAT_RGBA8)
	var cache = {}
	for placement in params.placements:
		var path = str(params.runtime_dir).path_join(str(placement.asset) + ".png")
		if placement.has("image"):
			path = str(params.repo_dir).path_join(str(placement.image))
		if not cache.has(path):
			var loaded = Image.load_from_file(path)
			if loaded == null or loaded.is_empty():
				return {"error": "Missing image", "path":path}
			loaded.convert(Image.FORMAT_RGBA8)
			cache[path] = loaded
		var source = cache[path]
		var area = Rect2i(0, 0, source.get_width(), source.get_height())
		if placement.has("clip"):
			var clip = placement.clip
			area = Rect2i(int(clip.x), int(clip.y), int(clip.width), int(clip.height))
		target.blend_rect(source, area, Vector2i(int(placement.x), int(placement.y)))
	return target
