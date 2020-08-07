/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Internal dependencies
 */
import {
  calculateFitTextFontSize,
  calculateTextHeight,
} from '../../utils/textMeasurements';
import { dataPixels } from '../../units';
import { resizeRules } from './index';

/**
 * Callback used in Moveable resize event
 *
 * @param {Element} element The element
 * @param {Array} direction Moveable direction
 * @param {number} newWidth New element width
 * @param {number} newHeight New element height
 * @param {Array} delta Moveable delta
 * @return {null|{skipUpdates: boolean, fontSize: number}|{height: number}} Information about properties to update
 */
function updateForResizeEvent(element, direction, newWidth, newHeight, delta) {
  const isResizingWidth = direction[0] !== 0;
  const isResizingHeight = direction[1] !== 0;
  const isSizingUp = delta ? delta[0] + delta[1] > 0 : true;

  // Vertical or diagonal resizing w/keep ratio.
  if (isResizingHeight) {
    const fontSize = calculateFitTextFontSize(
      element,
      newWidth || element.width,
      newHeight
    );
    const fontSizeInDataPx = dataPixels(fontSize);
    return {
      fontSize: fontSizeInDataPx,
      skipUpdates: !isSizingUp && fontSizeInDataPx < resizeRules.minFontSize,
    };
  }

  // Width-only resize: recalc height.
  if (isResizingWidth) {
    return { height: dataPixels(calculateTextHeight(element, newWidth)) };
  }

  return null;
}

export default updateForResizeEvent;
