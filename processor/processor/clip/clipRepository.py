from sqlalchemy.orm import Session
from clip.Clip import Fragment, Range, Section, Clip

from models import Clip as ClipModel, ClipRange, ClipSection, SectionFragment


def findClipById(session: Session, clipId: str):
    clip = session.query(ClipModel).filter(ClipModel.id == clipId).first()

    if clip is None:
        return None

    clipRange = session.query(ClipRange).filter(ClipRange.clipId == clipId).first()

    if clipRange is None:
        print("Clip range not found. This should not happen.")
        return None

    sections = session.query(ClipSection).filter(ClipSection.clipId == clipId).all()

    fragmentsList = []

    for section in sections:
        fragments = (
            session.query(SectionFragment)
            .filter(
                SectionFragment.sectionOrder == section.order,
                SectionFragment.clipId == clipId,
            )
            .all()
        )
        fragmentsList.append(fragments)

    return parseClip(clip, clipRange, sections, fragmentsList)

def finishClipProcessing(session: Session, clipId: str):
    clip = session.query(ClipModel).filter(ClipModel.id == clipId).first()

    if clip is None:
        return None

    clip.processing = False

def parseClip(
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
                        width=fragmentModel.width,
                        height=fragmentModel.height,
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

    return Clip(
        id=clipModel.id,
        sourceId=clipModel.sourceId,
        name=clipModel.name,
        url=clipModel.url,
        processing=clipModel.processing,
        width=clipModel.width,
        height=clipModel.height,
        createdAt=clipModel.createdAt,
        updatedAt=clipModel.updatedAt,
        range=clipRange,
        sections=sections,
    )
