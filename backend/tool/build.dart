import 'package:build_runner/build_runner.dart';
import 'package:json_serializable/json_serializable.dart';

void main(List<String> args) async {
  await build(
    [JsonSerializable()],
    deleteFilesByDefault: true,
  );
} 