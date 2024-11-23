from datetime import datetime
from enum import Enum
from typing import Optional

class ThemeShadow(str, Enum):
    NONE = "None"
    SMALL = "Small"
    MEDIUM = "Medium"
    LARGE = "Large"

class ThemeStroke(str, Enum):
    NONE = "None"
    SMALL = "Small"
    MEDIUM = "Medium"
    LARGE = "Large"

class ThemeEmojiPosition(str, Enum):
    TOP = "Top"
    BOTTOM = "Bottom"

class Range:
    def __init__(self, start: int, end: int):
        self.start: int = start
        self.end: int = end

    def __repr__(self):
        return f"Range(start={self.start!r}, end={self.end!r})"


class Fragment:
    def __init__(self, x: int, y: int, width: int, height: int):
        self.x: int = x
        self.y: int = y
        self.width: int = width
        self.height: int = height

    def __repr__(self):
        return f"Fragment(x={self.x!r}, y={self.y!r}, width={self.width!r}, height={self.height!r})"


class Section:
    def __init__(
        self, order: int, start: int, end: int, display: str, fragments: list[Fragment]
    ):
        self.order: int = order
        self.start: int = start
        self.end: int = end
        self.display: str = display
        self.fragments: list[Fragment] = fragments

    def __repr__(self):
        return f"Section(order={self.order!r}, start={self.start!r}, end={self.end!r}, display={self.display!r}, fragments={self.fragments!r})"


class Theme:
    def __init__(
        self,
        themeFont: str,
        themeFontColor: str,
        themeSize: int,
        themePosition: int,
        themeMainColor: str,
        themeSecondaryColor: str,
        themeThirdColor: str,
        themeStroke: ThemeStroke,
        themeStrokeColor: str,
        themeShadow: ThemeShadow,
        themeUpperText: bool,
        themeEmoji: bool,
        themeEmojiPosition: ThemeEmojiPosition,
    ):
        self.themeFont: str = themeFont
        self.themeFontColor: str = themeFontColor
        self.themeSize: int = themeSize
        self.themePosition: int = themePosition
        self.themeMainColor: str = themeMainColor
        self.themeSecondaryColor: str = themeSecondaryColor
        self.themeThirdColor: str = themeThirdColor
        self.themeStroke: ThemeStroke = themeStroke
        self.themeStrokeColor: str = themeStrokeColor
        self.themeShadow: ThemeShadow = themeShadow
        self.themeUpperText: bool = themeUpperText
        self.themeEmoji: bool = themeEmoji
        self.themeEmojiPosition: ThemeEmojiPosition = themeEmojiPosition

    def __repr__(self):
        return (
            "Theme(" + ", ".join([f"{k}={v!r}" for k, v in self.__dict__.items()]) + ")"
        )


class Clip:
    def __init__(
        self,
        id: str,
        sourceId: str,
        name: str,
        url: Optional[str],
        processing: bool,
        width: int,
        height: int,
        createdAt: datetime,
        updatedAt: datetime,
        range: Range,
        sections: list[Section],
        theme: Theme,
    ):
        self.id: str = id
        self.sourceId: str = sourceId
        self.name: str = name
        self.url: Optional[str] = url
        self.processing: bool = processing
        self.width: int = width
        self.height: int = height
        self.createdAt: datetime = createdAt
        self.updatedAt: datetime = updatedAt

        self.range: Range = range
        self.sections: list[Section] = sections

        self.theme: Theme = theme

    def __repr__(self):
        return f"Clip(id={self.id!r}, sourceId={self.sourceId!r}, name={self.name!r}, url={self.url!r}, processing={self.processing!r}, width={self.width!r}, height={self.height!r}, createdAt={self.createdAt!r}, updatedAt={self.updatedAt!r}, range={self.range!r}, sections={self.sections!r}), theme={self.theme!r}"
