// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'puzzle.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Puzzle _$PuzzleFromJson(Map<String, dynamic> json) => Puzzle(
      id: json['id'] as String,
      pgn: json['pgn'] as String,
      initialPly: (json['initialPly'] as num).toInt(),
      solution:
          (json['solution'] as List<dynamic>).map((e) => e as String).toList(),
      theme: json['theme'] as String,
    );

Map<String, dynamic> _$PuzzleToJson(Puzzle instance) => <String, dynamic>{
      'id': instance.id,
      'pgn': instance.pgn,
      'initialPly': instance.initialPly,
      'solution': instance.solution,
      'theme': instance.theme,
    };
