import MDXComponents from '@theme-original/MDXComponents';
import RepoCode from '@site/src/components/RepoCode';
import ProofLink from '@site/src/components/ProofLink';
import { ToSolution, ToStatement } from '@site/src/components/ExerciseLinks';

// Components available in every MDX page without importing them.
export default {
  ...MDXComponents,
  RepoCode,
  ProofLink,
  ToSolution,
  ToStatement,
};
