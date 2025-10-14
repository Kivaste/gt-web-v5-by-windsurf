- [x] hero page animated navigation should be delayed even when the reduce motion is enabled
- [x] Copy the hero slide scroll indicator but without the delay and animation (position should be fixed to the bottom of the animation range) and add that for all the pages except red banner and second CTA
- [x] yellow banner - fix mobile: add 10% of height, add a bit of white space to the sides
- [ ] hooked slide - Select the stage to place in this slot: this selector should act more like a popup or a dropdown menu that comes on top of the other content, rather than an extra container that is hidden and shown on click.
- [ ] Persuasion tricks in plain sight: copy
- [ ] Data > Oil: put the button click counters to the second column, right to the device info
- [ ] comments/These tools are too powerful!: fix the comments box to have the same font, text size etc like the email box'

- [ ] copy changes
    - [ ] These tools are too powerful! => It's hopeless!
    - [ ] These methods are too powerful. You have no chance against them. Just give up!
    - [ ] These could be some of the wrong arguments 
    - [ ] you're an absolute arse! Of course I ... ooh, that's how they got the engagement!



- [ ] Who am I?: copy
- [ ] What is gadgetTaming?: copy
- [ ] Recap: copy
- [ ] Hooked: interaction
- [ ] Hooked: copy
- [ ] Data > Oil: 
- [ ] CTA slideouts








------------

- [ ] hosting
    - [ ] cloudflare worker
- [ ] posthog for analytics





-----------

$99 not $100	Looks cheaper	Brain rounds down
Was $500, now $99	Anchor high, discount hard	Feels like a steal
Money-back guarantee	Kill risk	(You won't refund anyway)
Testimonials	Prove it works	Herd mentality
FAQ	Preempt objections	Smooth to "yes"
Progress bar	Keep you moving	Sunk cost fallacy
Scarcity	Panic buy	FOMO kicks in
Timer	Decide now	Urgency shorts logic


Element	Goal	Why it works
Charm pricing (.99/.97)	Make it feel cheaper	Left-digit bias
Anchor + big discount	Make the deal look huge	Anchoring, contrast
Decoy pricing (bad middle plan)	Steer you to the “right” plan	Asymmetric dominance
Free shipping threshold	Upsize your cart	Goal-gradient, mental accounting
BNPL/installments	Lower purchase pain	Present bias, partitioned pricing
Money-back guarantee	Remove risk	Risk reversal, loss aversion
Trust badges (SSL, logos)	Calm checkout anxiety	Authority signals, uncertainty reduction
Testimonials/ratings	Borrow credibility	Social proof, herd behavior
FAQ	Kill objections fast	Cognitive fluency, clarity
Scarcity/urgency (countdowns, low stock)	Force “now,” prevent delay	FOMO, scarcity heuristic
Progress meters (forms/checkout)	Keep you finishing	Goal-gradient, endowed progress
One clear CTA	Direct your click	Choice overload reduction, salience
Exit‑intent pop-up	Catch last‑chance conversions	Interruption, loss aversion
Retargeting (ads/emails)	Pull you back	Mere exposure, Zeigarnik effect




These tools are too powerful - you have no chance against them. 







--------

----
to recap perhaps

for better knowledge retention you should be doing the recap, but let me help you this time.

There are two industries that call their customers 'Users': tech and the shady guys close to the entrance of a rave party.

If you feel that your gadets are controlling you, instead of the other way around then know that it's not your fault, it is by design!

----------


Tech at it's best
productivity
creativity
connection

Tech at it's worst

distraction
pure consumption
loneliness

I've experienced the highest peaks and the lowerst black holes. Hence I'm a Technophile and a Tehnocritic (Technosceptic)


-----------------------

HOOKED

no, seriously, the book is called literally 'Hooked: How to Build Habit-Forming Products'

-----

ABOUT ME
All of the above is true - I'm a techie who has been abused by tech. Tech has been my passion, my hobbie, my career and my unhealthy coping mechanism and cause for distress. 

My dad was a programmer so I've had a computer at home since I can remember. My youth was spent gaming all night and then skipping school. 


I think I have been ahead of the curve with the struggles as well as the solutions.


-----
If you think this site is worth sharing then ... well you gotta fight fire with fire. Share it on social media :)


-----

recap
which of these have you experienced?
which of these have the biggest impact on you?

-----

about me

Kert Kivaste is my name and this is my face:
Supposedly adds credibility.

..
I'm a techie who has been abused by tech. Tech has been my passion, my hobbie, my career and my unhealthy coping mechanism and cause for distress. 

----

If you think this site is cool then ... well you gotta fight fire with fire. Please share it :)

---

Pricing 
- 99 97 let's be honest it's a 100
- 
Money back guarantee
Testimonials / social proof
FAQ
progress meters


----

Ready for me to solve all your problems?*
* this is a 
--------
Spooky? Consider everything you've seen and multiply it with tens or hundreds of millions of people. Spooky is an understatement.
-----




Step-by-Step Testing Plan
Refresh localization
Load the site and ensure translations have reinitialized (or manually trigger the localization script) so new strings from 
content/en.json
 appear.
Verify Data Trail layout
Navigate to the Data > Oil slide and confirm:
“Stats” and “Clicks” headings align with bullets and are underlined.
Guess-location button spans the full column width and reduced gap to the note.
Clicking multiple CTA buttons plus the guess button shows only five bullet entries including the guess button.
Test Hooked interaction


On the Holy grail slide, check that each slot initially reads “Select stage N” centered, and once a stage is chosen the placeholder disappears, showing only the chosen stage and description. Deselect/reassign to ensure placeholders return.
Inspect Comments slide
Verify the title “It's hopeless!”, the new intro paragraph, and that the textarea font/size matches the email input. Check that the localization still applies to placeholders and labels.
Review Tricks slide
Confirm the heading reads “Some more persuasion tricks in plain sight” and the updated table rows display exactly the new text.
Regression spot-check
Scroll through neighboring slides (e.g., Cookies) to confirm the adjusted copy (Oxford comma) appears and that no unexpected layout shifts occurred after the CSS changes.
Optional cross-device check
Resize to ≤640px width to ensure Data Trail layout, hooked slots, and comments form remain consistent with the mobile-specific CSS adjustments.

- Button labels (click counter)
  - "Scroll to next section" → "Scroll next"
  - "Free webinar" → "Webinar"
  - "Course: self-paced" → "Self-paced course"
  - "Course: live cohort" → "Live course"
  - "Team training" → "Team training"
  - "Discovery call" → "Book call"
  - "Donate" → "Donate"
  - "A" → "Variant A"
  - "B" → "Variant B"
  - "Select stage 1" → "Stage 1 slot"
  - "Select stage 2" → "Stage 2 slot"
  - "Select stage 3" → "Stage 3 slot"
  - "Select stage 4" → "Stage 4 slot"
  - "Close stage selector" → "Close picker"
  - "Trigger" → "Trigger"
  - "Action" → "Action"
  - "Variable Reward" → "Reward"
  - "Investment" → "Investment"
  - "Guess location" → "Guess location"
  - "Post comment" → "Post comment"
  - "Close dialog" → "Close popup"
  - "I see what's going on!" → "I see what's going on!"
  - "WTF is happening?" → "WTF is happening?




Hooked model selector popup:
1. Rounded corners change to 90degree corners
2. Stage background full black
3. close X mark - copy the other pop up look exactly
4. remove the horizontal line
5. change copy: 'Select the stage to place in this slot.' => 'Select the stage'
 
 

Simple behavior in anticipation of reward => Simplest next behavior



Trigger (scripts/hooked.js:1-7)
Cue that prompts you to act. 
Examples: Push notification, Inbox badge, Boredom scroll.

Action (scripts/hooked.js:8-13)
Simple behavior in anticipation of reward. 
Examples: Open the app, Swipe to refresh, Tap the play button.

Variable Reward (scripts/hooked.js:14-19)
Unpredictable payoff that hooks attention. 
Examples: New likes or comments, Loot drop, Fresh content.

Investment (scripts/hooked.js:20-25)
Effort that increases the product’s future value. 
Examples: Upload a photo, Follow friends, Save preferences.