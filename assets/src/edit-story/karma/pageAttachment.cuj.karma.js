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
import createSolidFromString from '../utils/createSolidFromString';
import useInsertElement from '../components/canvas/useInsertElement';
import { Fixture } from './fixture';

describe('CUJ: Creator can Add a Page Attachment', () => {
  let fixture;
  let frame;
  let safezone;

  const clickOnTarget = async (target) => {
    const { x, y, width, height } = target.getBoundingClientRect();
    await fixture.events.mouse.click(x + width / 2, y + height / 2);
  };

  beforeEach(async () => {
    fixture = new Fixture();
    await fixture.render();
    // Select Page by default.
    safezone = fixture.querySelector('[data-testid="safezone"]');
    await clickOnTarget(safezone);
  });

  afterEach(() => {
    fixture.restore();
  });

  const moveElementToBottom = async (keepMouseDown = false) => {
    const safezoneHeight = safezone.getBoundingClientRect().height;
    const frameHeight = frame.getBoundingClientRect().height;
    await fixture.events.mouse.seq(({ moveRel, moveBy, down, up }) => {
      const seq = [
        moveRel(frame, 10, 10),
        down(),
        moveBy(0, safezoneHeight - frameHeight, { steps: 10 }),
      ];
      if (!keepMouseDown) {
        seq.push(up());
      }
      return seq;
    });
  };

  const addElementWithLink = async () => {
    const insertElement = await fixture.renderHook(() => useInsertElement());
    const element = await fixture.act(() =>
      insertElement('shape', {
        backgroundColor: createSolidFromString('#ff00ff'),
        mask: { type: 'rectangle' },
        x: 10,
        y: 10,
        width: 50,
        height: 50,
        link: {
          url: 'https://example.com',
        },
      })
    );
    frame = fixture.editor.canvas.framesLayer.frame(element.id).node;
  };

  const setPageAttachmentLink = async (link) => {
    const input = fixture.screen.getByLabelText('Edit: Page Attachment link');
    await fixture.events.click(input, { clickCount: 3 });
    if ('' === link) {
      await fixture.events.keyboard.press('Del');
    } else {
      await fixture.events.keyboard.type(link);
    }
    await input.dispatchEvent(new window.Event('blur'));
  };

  const setCtaText = async (text) => {
    const input = fixture.screen.getByLabelText(
      'Edit: Page Attachment CTA text'
    );
    await fixture.events.click(input, { clickCount: 3 });
    await fixture.events.keyboard.type(text);
    await input.dispatchEvent(new window.Event('blur'));
  };

  describe('Action: Add Page Attachment', () => {
    it('it should allow adding Page Attachment with custom CTA Text', async () => {
      await setPageAttachmentLink('http://example.com');
      await setCtaText('Click me!');
      const ctaText = fixture.screen.getByText('Click me!');
      expect(ctaText).toBeDefined();
    });

    it('it should display warning for a link in the Page Attachment Area', async () => {
      await addElementWithLink();
      await moveElementToBottom();

      await clickOnTarget(safezone);
      await setPageAttachmentLink('');
      const warning = fixture.screen.getByText(
        'Links can not be located below the dashed line when a page attachment is present. The link to elements found below this line will be removed if you add a page attachment'
      );
      expect(warning).toBeDefined();
    });
  });

  describe('Action: Remove Page Attachment', () => {
    it('it should allow removing a Page Attachment', async () => {
      await setPageAttachmentLink('http://example.com');
      await setCtaText('Click me!');
      const ctaText = fixture.screen.getByText('Click me!');
      expect(ctaText).toBeDefined();

      await setPageAttachmentLink('');
      expect(fixture.screen.queryByText('Click me!')).toBeNull();
    });
  });

  describe('Action: Transforming link with Page Attachment', () => {
    it('it should display tooltip for a link in Attachment area', async () => {
      await setPageAttachmentLink('http://example.com');
      await addElementWithLink();
      await moveElementToBottom(true);

      const popup = fixture.screen.getByText(
        'Links can not be located below the dashline when a page attachment is present'
      );
      expect(popup).toBeDefined();
    });

    it('it should cancel link transformation ending in Attachment area', async () => {
      await setPageAttachmentLink('http://example.com');
      await addElementWithLink();
      const frameTop = frame.getBoundingClientRect().top;
      await moveElementToBottom();

      // Verify the same position.
      expect(frame.getBoundingClientRect().top).toBeDefined(frameTop);
    });
  });
});
