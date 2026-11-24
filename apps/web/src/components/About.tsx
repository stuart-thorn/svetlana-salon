import hairWash from "../assets/hair-wash.jpg";
import scissorCut from "../assets/scissor-cut.jpg";

const highlights = [
  {
    title: "For men, women and families",
    text: "Precision men's grooming and fades, women's cutting and blow-dries, and relaxed children's cuts, all under one roof.",
  },
  {
    title: "Every hair type, modern techniques",
    text: "We work with all hair types, and the whole team uses modern precision techniques: razor cutting, texturing, thinning and chopping. Not sure how to describe the cut? Bring a photo or a celebrity look and we'll tailor it to suit you.",
  },
  {
    title: "Technical colour",
    text: "Colour, highlights, balayage and Nanoplasty smoothing, starting with a consultation and a patch test at least 24 hours before.",
  },
  {
    title: "Personalised Hair Design & Cut",
    text: "A tailored consultation and a bespoke cut designed around your face shape, hair texture and lifestyle.",
  },
  {
    title: "Right in Canary Wharf",
    text: "Minutes from the Elizabeth line and Jubilee line, perfect before or after work.",
  },
];

export default function About() {
  return (
    <section id="about" className="py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="grid grid-cols-5 gap-4">
          <img
            src={hairWash}
            alt="Stylist washing a client's hair at the basin"
            loading="lazy"
            className="col-span-3 aspect-[3/4] h-full w-full rounded-2xl object-cover"
          />
          <img
            src={scissorCut}
            alt="Barber cutting a client's hair with scissors and comb"
            loading="lazy"
            className="col-span-2 mt-12 aspect-[3/4] w-full rounded-2xl object-cover"
          />
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">About us</p>
          <h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">
            Accessible premium hair in the middle of the city
          </h2>
          <p className="mt-6 leading-relaxed text-muted">
            N&G Canary Wharf is a family hair salon for everyone: commuters on a lunch break, families at the
            weekend and anyone who wants premium results without the fuss. Every appointment begins
            with a proper consultation, so we understand your hair, your routine and the look you want.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Whether it's a quick graded cut before work, a skin fade, a blow-dry for the evening, your
            child's haircut or a full colour transformation, you'll leave feeling looked after.
          </p>

          <ul className="mt-10 space-y-6">
            {highlights.map((h) => (
              <li key={h.title} className="flex gap-4">
                <span className="mt-2 h-px w-8 shrink-0 bg-accent" aria-hidden />
                <div>
                  <h3 className="font-medium">{h.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{h.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
