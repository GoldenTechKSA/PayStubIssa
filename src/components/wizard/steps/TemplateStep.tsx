import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Grid, Box, Card, CardActionArea, CardMedia, Typography, TextField, Stack, Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { updateAppSettings } from "../../../redux/actions";
import { PayStubDetails, AppSettings } from "assets/data/pay-stub-details";
import { WizardStepLayout } from "../WizardStepLayout";
import TemplateManager from "../../../templates/components/templatemanager";

interface TemplateMeta {
  imageFile: string;
  configFile: string;
  imageName: string;
  title: string;
  description: string;
}

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

// Templates with authored + verified XML that render a live preview today.
// Others are shown in the catalog as "coming soon" until their layouts are built.
const AVAILABLE_CONFIGS = new Set<string>(["/configs/template-simple/paystub-config.xml"]);

const FALLBACK_THUMB = `${process.env.PUBLIC_URL}/images/thumb0.png`;

const TemplateStep: React.FC<StepProps> = ({ onNext, onBack }) => {
  const dispatch = useDispatch();
  const fullState = useSelector((s: PayStubDetails) => s);
  const { templateId, configPath } = useSelector<PayStubDetails, AppSettings>(s => s.appSettings);

  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/configs/template-configs.json`)
      .then(r => r.json())
      .then((data: TemplateMeta[]) => setTemplates(data))
      .catch(err => console.error("Failed to load template catalog:", err));
  }, []);

  const select = (index: number, t: TemplateMeta) => {
    dispatch(updateAppSettings({ configPath: t.configFile, templateId: index }));
  };

  const q = query.trim().toLowerCase();
  const filtered = templates
    .map((t, index) => ({ t, index }))
    .filter(({ t }) => !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));

  const previewAvailable = AVAILABLE_CONFIGS.has(configPath);

  return (
    <WizardStepLayout
      title="Choose a template"
      subtitle="Pick a layout — your details appear live in the preview."
      onBack={onBack}
      onNext={onNext}
      nextLabel="Continue to review"
    >
      <Grid container spacing={3}>
        {/* Gallery */}
        <Grid size={{ xs: 12, md: 5 }}>
          <TextField fullWidth size="small" label="Search templates" value={query} onChange={e => setQuery(e.target.value)} sx={{ mb: 2 }} />
          <Box sx={{ maxHeight: { md: "68vh" }, overflowY: { md: "auto" }, pr: { md: 1 } }}>
            <Stack spacing={1.5}>
              {filtered.map(({ t, index }) => {
                const selected = index === templateId;
                const available = AVAILABLE_CONFIGS.has(t.configFile);
                return (
                  <Card
                    key={`${t.configFile}-${index}`}
                    variant="outlined"
                    sx={{ borderColor: selected ? "primary.main" : "divider", borderWidth: selected ? 2 : 1, opacity: available ? 1 : 0.6 }}
                  >
                    <CardActionArea onClick={() => select(index, t)} disabled={!available}>
                      <Stack direction="row" spacing={1.5} sx={{ p: 1.5 }} alignItems="center">
                        <CardMedia
                          component="img"
                          image={`${process.env.PUBLIC_URL}/images/${t.imageFile}`}
                          alt={t.title}
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).src = FALLBACK_THUMB; }}
                          sx={{ width: 72, height: 56, objectFit: "cover", borderRadius: 1, border: 1, borderColor: "divider", flexShrink: 0 }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle2" noWrap>{t.title}</Typography>
                            {selected && <CheckCircleIcon color="primary" fontSize="small" />}
                          </Stack>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                          >
                            {t.description}
                          </Typography>
                          {!available && <Chip label="Preview coming soon" size="small" variant="outlined" sx={{ mt: 0.5 }} />}
                        </Box>
                      </Stack>
                    </CardActionArea>
                  </Card>
                );
              })}
            </Stack>
          </Box>
        </Grid>

        {/* Live preview */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Live preview</Typography>
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "#fff", p: 2, maxHeight: "68vh", overflow: "auto" }}>
            {previewAvailable ? (
              <TemplateManager id={templateId} configPath={configPath} store={fullState} />
            ) : (
              <Typography color="text.secondary" sx={{ p: 2 }}>
                A live preview for this template is coming soon. Your details are saved — choose an available template to preview it now.
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </WizardStepLayout>
  );
};

export default TemplateStep;
