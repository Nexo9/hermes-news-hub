import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Heart, ExternalLink, Code, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Contributions = () => {
  const navigate = useNavigate();

  const causes = [
    {
      country: "Palestine",
      flag: "🇵🇸",
      situation: "Depuis des décennies, le peuple palestinien fait face à une occupation militaire, des déplacements forcés et des violations des droits humains. La situation humanitaire à Gaza est particulièrement critique, avec un accès limité à l'eau potable, à la nourriture, aux soins médicaux et à l'électricité. Des millions de personnes vivent dans des conditions de siège, privées de leurs droits fondamentaux.",
      donationLinks: [
        { name: "UNRWA (Nations Unies)", url: "https://donate.unrwa.org/" },
        { name: "Médecins Sans Frontières", url: "https://www.msf.fr/agir/rejoindre-nos-equipes/palestine" },
        { name: "UNICEF Palestine", url: "https://www.unicef.org/appeals/state-of-palestine" },
        { name: "Islamic Relief", url: "https://www.islamic-relief.org/palestine/" },
      ]
    },
    {
      country: "Congo (RDC)",
      flag: "🇨🇩",
      situation: "La République Démocratique du Congo traverse une crise humanitaire majeure, notamment dans l'est du pays. Les conflits armés, l'exploitation illégale des ressources naturelles et les violences ont provoqué des millions de déplacés internes. Les populations civiles, en particulier les femmes et les enfants, sont victimes de violences extrêmes et vivent dans une précarité absolue.",
      donationLinks: [
        { name: "UNHCR Congo", url: "https://donate.unhcr.org/" },
        { name: "Médecins Sans Frontières", url: "https://www.msf.fr/" },
        { name: "UNICEF RDC", url: "https://www.unicef.org/drcongo/" },
        { name: "Mercy Corps", url: "https://www.mercycorps.org/where-we-work/democratic-republic-congo" },
      ]
    },
    {
      country: "Soudan",
      flag: "🇸🇩",
      situation: "Le Soudan est plongé dans un conflit armé dévastateur depuis avril 2023. Les affrontements entre factions militaires ont causé des milliers de morts et déplacé des millions de personnes. La population fait face à une famine imminente, un effondrement du système de santé et une crise humanitaire sans précédent. L'accès à l'aide humanitaire reste extrêmement difficile.",
      donationLinks: [
        { name: "UNHCR Soudan", url: "https://donate.unhcr.org/" },
        { name: "Croix-Rouge", url: "https://www.icrc.org/en/where-we-work/africa/sudan" },
        { name: "World Food Programme", url: "https://www.wfp.org/emergencies/sudan-emergency" },
        { name: "Save the Children", url: "https://www.savethechildren.org/us/where-we-work/sudan" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Contributions & Causes</h1>
              <p className="text-sm text-muted-foreground">L'humain au cœur de notre mission</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Developer Credit */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Code className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl">Développé par Ibrahim Mohamed Antik</CardTitle>
            <CardDescription className="text-base mt-2">
              Ce site a été entièrement conçu, développé et maintenu par Ibrahim Mohamed Antik.
              HERMÈS est né d'une vision : créer une plateforme d'information neutre, accessible et humaine.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Passionné par la technologie et convaincu que l'information doit être libre et impartiale,
              j'ai créé HERMÈS pour offrir une alternative aux médias traditionnels.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Mission Statement */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive mb-4">
            <Heart className="w-5 h-5" />
            <span className="font-semibold">Notre Engagement Humanitaire</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            HERMÈS soutient la Palestine, le Congo et le Soudan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Une partie des bénéfices générés par le projet HERMÈS est reversée à des organisations
            humanitaires œuvrant sur le terrain dans ces régions en crise.
          </p>
        </div>

        {/* Causes */}
        <div className="space-y-8">
          {causes.map((cause, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{cause.flag}</span>
                  <div>
                    <CardTitle className="text-xl">{cause.country}</CardTitle>
                    <CardDescription>Crise humanitaire en cours</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {cause.situation}
                </p>
                
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Comment aider ?
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cause.donationLinks.map((link, linkIndex) => (
                      <a
                        key={linkIndex}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-md bg-background hover:bg-primary/10 border border-border hover:border-primary/50 transition-colors group"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        <span className="text-sm text-foreground group-hover:text-primary">
                          {link.name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20">
          <CardContent className="py-8 text-center">
            <Heart className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              Chaque geste compte
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              En utilisant HERMÈS, vous contribuez indirectement à ces causes.
              Mais vous pouvez aussi agir directement en faisant un don aux organisations listées ci-dessus.
              Ensemble, nous pouvons faire la différence.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => navigate('/')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
              <Button onClick={() => navigate('/pricing')} className="bg-primary hover:bg-primary/90">
                <Heart className="w-4 h-4 mr-2" />
                Soutenir HERMÈS
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          HERMÈS s'engage à la transparence totale sur l'utilisation des fonds.
          Pour toute question, contactez-nous.
        </p>
      </main>
    </div>
  );
};

export default Contributions;
