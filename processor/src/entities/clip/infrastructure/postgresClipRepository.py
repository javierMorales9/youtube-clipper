from sqlalchemy.orm import Session
from entities.clip.domain.Clip import ClipState, Fragment, Range, Section, Clip, Theme

from models import Clip as ClipModel, ClipRange, ClipSection, SectionFragment

class PostgresClipRepository():
    def __init__ (
        self,
        session: Session,
    ):
        self.session = session


    def findClipById(self, clipId: str):
        clip = self.session.query(ClipModel).filter(ClipModel.id == clipId).first()

        if clip is None:
            return None

        clipRange = self.session.query(ClipRange).filter(ClipRange.clipId == clipId).first()

        if clipRange is None:
            print("Clip range not found. This should not happen.")
            return None

        sections = self.session.query(ClipSection).filter(ClipSection.clipId == clipId).all()

        fragmentsList = []

        for section in sections:
            fragments = (
                self.session.query(SectionFragment)
                .filter(
                    SectionFragment.sectionOrder == section.order,
                    SectionFragment.clipId == clipId,
                )
                .all()
            )
            fragmentsList.extend(fragments)

        return self.parseClip(clip, clipRange, sections, fragmentsList)

    def finishClipProcessing(self, clipId: str):
        clip = self.session.query(ClipModel).filter(ClipModel.id == clipId).first()

        if clip is None:
            return None

        clip.processing = False
        clip.state = ClipState.GENERATED

    def parseClip(
        self,
        clipModel: ClipModel,
        rangeModel: ClipRange,
        sectionModels: list[ClipSection],
        fragmentModels: list[SectionFragment],
    ):
        sections: list[Section] = []

        for sectionModel in sectionModels:
            fragments: list[Fragment] = []
            for fragmentModel in fragmentModels:
                if fragmentModel.sectionOrder == sectionModel.order:
                    fragments.append(
                        Fragment(
                            x=fragmentModel.x,
                            y=fragmentModel.y,
                            size=fragmentModel.size,
                        )
                    )
            sections.append(
                Section(
                    order=sectionModel.order,
                    start=sectionModel.start,
                    end=sectionModel.end,
                    display=sectionModel.display,
                    fragments=fragments,
                )
            )

        clipRange = Range(
            start=rangeModel.start,
            end=rangeModel.end,
        )

        theme = Theme(
            themeFont=clipModel.themeFont,
            themeFontColor=clipModel.themeFontColor,
            themeSize=clipModel.themeSize,
            themePosition=clipModel.themePosition,
            themeMainColor=clipModel.themeMainColor,
            themeSecondaryColor=clipModel.themeSecondaryColor,
            themeThirdColor=clipModel.themeThirdColor,
            themeStroke=clipModel.themeStroke,
            themeStrokeColor=clipModel.themeStrokeColor,
            themeShadow=clipModel.themeShadow,
            themeUpperText=clipModel.themeUpperText,
            themeEmoji=clipModel.themeEmoji,
            themeEmojiPosition=clipModel.themeEmojiPosition,
        )

        return Clip(
            id=clipModel.id,
            companyId=clipModel.companyId,
            sourceId=clipModel.sourceId,
            name=clipModel.name,
            url=clipModel.url,
            processing=clipModel.processing,
            state=clipModel.state,
            width=clipModel.width,
            height=clipModel.height,
            createdAt=clipModel.createdAt,
            updatedAt=clipModel.updatedAt,
            range=clipRange,
            sections=sections,
            theme=theme,
        )
