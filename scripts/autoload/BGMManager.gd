extends Node
## BGMManager — 背景音乐全局管理器（Autoload单例）
##
## 职责：
## - 进入游戏自动循环播放 BGM，跨场景不间断
## - 提供播放/暂停/音量控制接口（供设置菜单或场景脚本调用）
## - BGM 资源路径硬编码，便于一行接入

const BGM_PATH: String = "res://assets/audio/The_Last_Exhibit.mp3"

var _player: AudioStreamPlayer


func _ready() -> void:
	_player = AudioStreamPlayer.new()
	_player.bus = &"Master"
	_player.volume_db = -6.0  # 略微降低，避免盖过对话/打字机音效
	add_child(_player)

	_load_and_play()


## 加载 BGM 资源并播放（mp3 设置循环）
func _load_and_play() -> void:
	var stream: AudioStream = load(BGM_PATH)
	if stream == null:
		push_error("[BGMManager] BGM 加载失败: %s（请确认文件已复制到 assets/audio/ 且 Godot 已导入）" % BGM_PATH)
		return

	# AudioStreamMP3 设置循环（Godot 4 中 mp3 导入后是 AudioStreamMP3）
	if stream is AudioStreamMP3:
		(stream as AudioStreamMP3).loop = true

	_player.stream = stream
	_player.play()
	print("[BGMManager] BGM 已开始循环播放: %s" % BGM_PATH)


## 重新播放（从头开始）
func play() -> void:
	if _player != null and _player.stream != null:
		_player.play()


## 暂停（保留进度，可恢复）
func pause() -> void:
	if _player != null:
		_player.stream_paused = true


## 恢复播放
func resume() -> void:
	if _player != null:
		_player.stream_paused = false


## 设置音量（dB，-80 静音 ~ 0 最大 ~ +6 增益）
func set_volume(db: float) -> void:
	if _player != null:
		_player.volume_db = clampf(db, -80.0, 6.0)


## 停止播放（不保留进度）
func stop() -> void:
	if _player != null:
		_player.stop()


## 当前是否正在播放
func is_playing() -> bool:
	return _player != null and _player.playing
