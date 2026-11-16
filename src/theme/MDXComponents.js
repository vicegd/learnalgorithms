import MDXComponents from '@theme-original/MDXComponents';
import RepoCode from '@site/src/components/RepoCode';
import ProofLink from '@site/src/components/ProofLink';
import { ToSolution, ToStatement } from '@site/src/components/ExerciseLinks';
import Figure from '@site/src/components/Figure';
import Origin from '@site/src/components/Origin';
import LessonMeta from '@site/src/components/LessonMeta';

// Components available in every MDX page without importing them.
export default {
  ...MDXComponents,
  RepoCode,
  ProofLink,
  ToSolution,
  ToStatement,
  Figure,
  Origin,
  LessonMeta,
};
