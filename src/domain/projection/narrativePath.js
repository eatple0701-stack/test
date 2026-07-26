// NarrativePath — a narrative rendered against one traveller's journey.
//
// Read-only and recomputed on every call. Nothing here is persisted: adding
// a step to a narrative must change the answer immediately rather than
// leaving a stale figure behind.

import { experienceById, narrativeById, stepsOfNarrative } from '../catalog/index.js';
import { experienceDone } from '../policy/completion.js';

export function narrativePath(narrativeId, journey) {
  const narrative = narrativeById(narrativeId);
  const steps = stepsOfNarrative(narrativeId).map(s => {
    const experience = experienceById(s.experienceId);
    return {
      experienceId: s.experienceId,
      order: s.order,
      required: s.required,
      transition: s.transition,
      title: experience?.title ?? s.experienceId,
      done: experienceDone(experience, journey),
    };
  });

  const required = steps.filter(s => s.required);

  return {
    narrativeId,
    title: narrative?.title ?? narrativeId,
    steps,
    requiredCount: required.length,
    doneCount: required.filter(s => s.done).length,
    complete: required.length > 0 && required.every(s => s.done),
  };
}
