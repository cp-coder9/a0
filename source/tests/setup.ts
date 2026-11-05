import '@testing-library/jest-dom/vitest';
import {cleanup} from '@testing-library/react';
import {afterEach} from 'vitest';
// The 3D preview is gated by a build-time flag that defaults off (Barry's release-integrity
// finding). Tests are the one place we opt in, so viewer behaviour stays exercisable while a
// production build still refuses it.
process.env.NEXT_PUBLIC_SUPPLIED_3D_PREVIEW='true';
afterEach(cleanup);
