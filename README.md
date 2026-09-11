# Ski Touring Risk

## Purpose

Ski Touring Risk estimates the current terrain slope during a ski-touring
activity and presents a five-level exposure band on the watch.

## Declared resources

The manifest exposes only values consumed by the UI or written to exercise
data: `slopeDeg`, `riskLevel`, `slopeBand`, `isDescending`, and `slopeMethod`.
Calculation state is kept in the private `state` object in `main.js`.

### GPS path

The GPS path converts successive positions into local north/east distances and
tracks their bearing. The first movement must be at least 10 m to initialise a
segment. Subsequent movements below 5 m are ignored.

Two calculation modes are used:

- **Straight segment**: consecutive segments are accumulated until 80 m is
  reached. Slope is calculated from altitude change over that distance.
- **Traverse conversion**: a bearing change of at least 75 degrees identifies
  a conversion. The slope is calculated between the midpoints of the previous
  and current traverse.

Mode switching uses hysteresis. Once conversion mode is active, it remains
active until the bearing change falls below 45 degrees. This prevents GPS
noise near the entry threshold from repeatedly changing the active method.

### Distance fallback

When usable GPS coordinates are not available, the application uses activity
distance and altitude. A new estimate is produced after at least 30 m of
horizontal movement.

### Smoothing and classification

Each new raw slope is clamped to 0-55 degrees and passed through a three-value
moving average before being exposed as `slopeDeg`.

`riskLevel` and `slopeBand` use the following boundaries:

| Value | Slope |
| ---: | --- |
| 0 | `< 25` degrees |
| 1 | `25-29` degrees |
| 2 | `30-34` degrees |
| 3 | `35-39` degrees |
| 4 | `>= 40` degrees |

`isDescending` is set when the latest altitude is lower than the previous
reference altitude. `slopeMethod` is `0` for conversion mode, `1` for straight
segment mode, and `-1` before a method has produced a result.

## UI and localization

The watch UI is defined in `t.html`. It displays the slope, risk band,
descending indicator, and one of the official Suunto icon glyphs for the active
calculation method:

- `F280`: straight-segment method;
- `F286`: traverse-conversion method.

Text placeholders use SuuntoPlus localization identifiers. The repository
contains JSON language files matching the language codes supported by the
SuuntoPlus Editor, including `en`, `fr`, `de`, `es`, `it`, `ja`, `ko`,
`zh-Hans`, and `zh-Hant`.

## Files

- `manifest.json`: native inputs, published outputs, and template declaration;
- `main.js`: lifecycle callbacks, coordinate parsing, slope calculation,
  smoothing, hysteresis, and reset handling;
- `t.html`: watch UI and subscriptions to published outputs;
- `*.json`: localized UI strings;
