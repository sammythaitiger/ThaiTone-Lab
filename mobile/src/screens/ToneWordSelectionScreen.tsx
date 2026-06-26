import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  Searchbar,
  Text,
} from "react-native-paper";

import { BottomTabBar } from "../components/practice/BottomTabBar";
import { AnimatedEntrance } from "../components/practice/AnimatedEntrance";
import { PracticeStateCard } from "../components/practice/PracticeStateCard";
import { RecentAttemptsPanel } from "../components/practice/RecentAttemptsPanel";
import { WordSelectionCard } from "../components/practice/WordSelectionCard";
import { SyllableFilter } from "../store/practiceStore";
import { appColors, toneColors } from "../theme/colors";
import { PracticeAttempt, PracticeWord, ThaiTone } from "../types/practice";
import { getMotionDelay } from "../utils/motion";
import { useMotionTransition } from "../hooks/useMotionTransition";

type ToneWordSelectionScreenProps = {
  wordsCount: number;
  filteredWords: PracticeWord[];
  selectedTones: ThaiTone[];
  syllableFilter: SyllableFilter;
  searchQuery: string;
  practiceHistory: PracticeAttempt[];
  isLoading: boolean;
  errorMessage: string;
  onToggleTone: (tone: ThaiTone) => void;
  onSetSyllableFilter: (filter: SyllableFilter) => void;
  onSearchChange: (value: string) => void;
  onOpenPractice: (wordId: string) => void;
  onClearFilters: () => void;
  onClearPracticeHistory: () => void;
  onRetry: () => void;
  onOpenShowcase?: () => void;
};

const TONE_FILTERS: Array<{ key: ThaiTone; label: string }> = [
  { key: "mid", label: "M" },
  { key: "low", label: "L" },
  { key: "falling", label: "F" },
  { key: "high", label: "H" },
  { key: "rising", label: "R" },
];

const SYLLABLE_FILTERS: SyllableFilter[] = ["1", "2", "3", "4+"];

export function ToneWordSelectionScreen({
  wordsCount,
  filteredWords,
  selectedTones,
  syllableFilter,
  searchQuery,
  practiceHistory,
  isLoading,
  errorMessage,
  onToggleTone,
  onSetSyllableFilter,
  onSearchChange,
  onOpenPractice,
  onClearFilters,
  onClearPracticeHistory,
  onRetry,
  onOpenShowcase,
}: ToneWordSelectionScreenProps) {
  const isInitialLoading = isLoading && wordsCount === 0;
  const hasFilters =
    selectedTones.length > 0 || Boolean(syllableFilter) || Boolean(searchQuery);
  const hasBlockingError = Boolean(errorMessage) && wordsCount === 0;
  const activeFilterCount =
    selectedTones.length + (syllableFilter ? 1 : 0) + (searchQuery ? 1 : 0);
  const featuredWord = filteredWords.length > 0 ? filteredWords[0] : null;
  const activeFilterLabels: string[] = [];

  selectedTones.forEach((tone) => {
    activeFilterLabels.push(`Tone: ${tone}`);
  });

  if (syllableFilter) {
    activeFilterLabels.push(`Syllables: ${syllableFilter}`);
  }

  if (searchQuery.trim()) {
    activeFilterLabels.push(`Search: ${searchQuery.trim()}`);
  }

  useMotionTransition(
    [
      String(isLoading),
      String(hasBlockingError),
      String(filteredWords.length),
      String(hasFilters),
      String(activeFilterCount),
    ].join(":")
  );

  return (
    <View style={styles.screen}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="Practice Thai Tones" />
        {onOpenShowcase ? (
          <Appbar.Action
            icon="view-dashboard-outline"
            onPress={onOpenShowcase}
            containerColor={appColors.surfaceVariant}
          />
        ) : null}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {!isInitialLoading ? (
          <AnimatedEntrance delay={0} variant="hero">
            <View style={styles.topSection}>
              <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                  <View style={styles.heroBadge}>
                    <Text variant="labelMedium" style={styles.heroBadgeText}>
                      Tone Lab
                    </Text>
                  </View>
                  <Text variant="labelMedium" style={styles.heroMeta}>
                    {wordsCount} total words
                  </Text>
                </View>

                <Text variant="headlineMedium" style={styles.heroTitle}>
                  Choose a word to practice its Thai tone pattern.
                </Text>
                <Text variant="bodyLarge" style={styles.heroCopy}>
                  Use tone filters, syllable count, or search to find the right
                  practice word.
                </Text>

                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStatCard}>
                    <Text variant="labelSmall" style={styles.heroStatLabel}>
                      Visible
                    </Text>
                    <Text variant="headlineSmall" style={styles.heroStatValue}>
                      {filteredWords.length}
                    </Text>
                    <Text variant="bodySmall" style={styles.heroStatHint}>
                      Ready to practice now
                    </Text>
                  </View>
                  <View style={styles.heroStatCard}>
                    <Text variant="labelSmall" style={styles.heroStatLabel}>
                      Filters
                    </Text>
                    <Text variant="headlineSmall" style={styles.heroStatValue}>
                      {activeFilterCount}
                    </Text>
                    <Text variant="bodySmall" style={styles.heroStatHint}>
                      Narrow the word list
                    </Text>
                  </View>
                  <View style={styles.heroStatCard}>
                    <Text variant="labelSmall" style={styles.heroStatLabel}>
                      Attempts
                    </Text>
                    <Text variant="headlineSmall" style={styles.heroStatValue}>
                      {practiceHistory.length}
                    </Text>
                    <Text variant="bodySmall" style={styles.heroStatHint}>
                      Saved on this device
                    </Text>
                  </View>
                </View>

                {featuredWord ? (
                  <AnimatedEntrance delay={90} variant="section">
                    <View style={styles.featuredCard}>
                      <View style={styles.featuredHeader}>
                        <View>
                          <Text variant="labelMedium" style={styles.featuredEyebrow}>
                            Recommended start
                          </Text>
                          <Text variant="headlineSmall" style={styles.featuredTitle}>
                            {featuredWord.thai}
                          </Text>
                        </View>
                        <Button
                          mode="contained"
                          compact
                          onPress={() => void onOpenPractice(featuredWord.id)}
                        >
                          Practice
                        </Button>
                      </View>

                      <Text variant="bodyMedium" style={styles.featuredCopy}>
                        {featuredWord.transcription} · {featuredWord.english}
                      </Text>

                      <View style={styles.featuredToneRow}>
                        {featuredWord.syllables.map((syllable, index) => (
                          <Chip
                            key={`${featuredWord.id}-featured-${index}`}
                            compact
                            style={styles.featuredToneChip}
                            textStyle={styles.featuredToneChipText}
                          >
                            {syllable.thai} · {TONE_FILTERS.find((tone) => tone.key === syllable.tone)?.label ?? syllable.tone}
                          </Chip>
                        ))}
                      </View>
                    </View>
                  </AnimatedEntrance>
                ) : null}
              </View>

              <RecentAttemptsPanel
                attempts={practiceHistory}
                onOpenPractice={onOpenPractice}
                onClear={onClearPracticeHistory}
              />

              <View style={styles.filtersCard}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Tone filters
                </Text>
                <Text variant="bodySmall" style={styles.sectionCopy}>
                  Use one or more filters to focus the list before you start.
                </Text>

                <View style={styles.filterRow}>
                  {TONE_FILTERS.map((tone) => (
                    <Chip
                      key={tone.key}
                      selected={selectedTones.includes(tone.key)}
                      showSelectedOverlay={false}
                      onPress={() => onToggleTone(tone.key)}
                      style={[
                        styles.toneFilterChip,
                        { backgroundColor: toneColors[tone.key] },
                      ]}
                      textStyle={styles.toneFilterText}
                    >
                      {tone.label}
                    </Chip>
                  ))}
                </View>

                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Syllable count
                </Text>
                <View style={styles.filterRow}>
                  {SYLLABLE_FILTERS.map((filter) => (
                    <Chip
                      key={filter}
                      selected={syllableFilter === filter}
                      showSelectedOverlay={false}
                      onPress={() =>
                        onSetSyllableFilter(syllableFilter === filter ? null : filter)
                      }
                      style={[
                        styles.countChip,
                        syllableFilter === filter ? styles.countChipSelected : null,
                      ]}
                      textStyle={[
                        styles.countChipText,
                        syllableFilter === filter ? styles.countChipTextSelected : null,
                      ]}
                    >
                      {filter}
                    </Chip>
                  ))}
                </View>

                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Search
                </Text>
                <Searchbar
                  placeholder="Search words..."
                  value={searchQuery}
                  onChangeText={onSearchChange}
                  style={styles.searchbar}
                  inputStyle={styles.searchInput}
                />

                {hasFilters ? (
                  <View style={styles.activeFiltersPanel}>
                    <View style={styles.activeFiltersHeader}>
                      <Text variant="labelMedium" style={styles.activeFiltersTitle}>
                        Active filters
                      </Text>
                      <Button compact mode="text" onPress={onClearFilters}>
                        Clear all
                      </Button>
                    </View>

                    <View style={styles.activeFiltersRow}>
                      {activeFilterLabels.map((label) => (
                        <View key={label} style={styles.activeFilterPill}>
                          <Text variant="bodySmall" style={styles.activeFilterText}>
                            {label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>

            </View>
          </AnimatedEntrance>
        ) : null}

        {isLoading ? (
          <PracticeStateCard
            eyebrow="Loading"
            title="Preparing your practice library"
            description="Fetching Thai tone words and getting the screen ready for practice."
          >
            <View style={styles.loadingIndicatorRow}>
              <ActivityIndicator />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Loading words...
              </Text>
            </View>
            <View style={styles.skeletonList}>
              {[0, 1, 2].map((item) => (
                <View key={item} style={styles.skeletonCard}>
                  <View style={styles.skeletonHeaderRow}>
                    <View style={styles.skeletonTitleBlock}>
                      <View style={styles.skeletonTitle} />
                      <View style={styles.skeletonSubtitle} />
                    </View>
                    <View style={styles.skeletonBadge} />
                  </View>
                  <View style={styles.skeletonMetaRow}>
                    <View style={styles.skeletonMetaPill} />
                    <View style={styles.skeletonMetaPill} />
                  </View>
                  <View style={styles.skeletonToneRow}>
                    <View style={styles.skeletonTonePill} />
                    <View style={styles.skeletonTonePill} />
                    <View style={styles.skeletonTonePillShort} />
                  </View>
                </View>
              ))}
            </View>
          </PracticeStateCard>
        ) : null}

        {!isLoading && hasBlockingError ? (
          <PracticeStateCard
            eyebrow="Error"
            title="Unable to load practice words"
            description={errorMessage}
            tone="danger"
            primaryActionLabel="Retry"
            onPrimaryAction={onRetry}
          />
        ) : null}

        {!isLoading && !hasBlockingError && filteredWords.length === 0 ? (
          <PracticeStateCard
            eyebrow="No matches"
            title="No words match your criteria"
            description={
              hasFilters
                ? "Try removing some filters, clearing search, or broadening the tone selection."
                : "The practice library is empty right now. Try reloading to fetch the latest data."
            }
            primaryActionLabel={hasFilters ? "Clear all filters" : "Retry"}
            onPrimaryAction={hasFilters ? onClearFilters : onRetry}
          >
            {hasFilters ? (
              <View style={styles.emptyHelperRow}>
                <Text variant="bodySmall" style={styles.emptyHelperText}>
                  Active filters: {activeFilterCount}
                </Text>
              </View>
            ) : null}
          </PracticeStateCard>
        ) : null}

        {!isLoading ? (
          <AnimatedEntrance delay={getMotionDelay(2, 30)} variant="section">
          <View style={styles.listSection}>
            {filteredWords.map((word, index) => (
              <AnimatedEntrance
                key={word.id}
                delay={getMotionDelay(0, 20)}
                staggerIndex={index}
                variant="list"
              >
                <WordSelectionCard
                  word={word}
                  onPractice={() => void onOpenPractice(word.id)}
                />
              </AnimatedEntrance>
            ))}
          </View>
          </AnimatedEntrance>
        ) : null}

        {!isInitialLoading ? (
          <Text variant="bodySmall" style={styles.footerText}>
            Showing {filteredWords.length} of {wordsCount} words
          </Text>
        ) : null}
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  appbar: {
    backgroundColor: appColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: appColors.outlineVariant,
  },
  content: {
    padding: 16,
    gap: 20,
    paddingBottom: 32,
  },
  topSection: {
    gap: 20,
  },
  heroCard: {
    borderRadius: 30,
    backgroundColor: appColors.heroPrimary,
    padding: 22,
    gap: 16,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  heroBadge: {
    borderRadius: 999,
    backgroundColor: appColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    color: appColors.onPrimary,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  heroMeta: {
    color: appColors.heroAccent,
  },
  heroTitle: {
    color: appColors.heroText,
    lineHeight: 36,
  },
  heroCopy: {
    color: appColors.heroTextSoft,
    lineHeight: 23,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: appColors.heroSecondary,
    padding: 16,
  },
  heroStatLabel: {
    color: appColors.heroAccentSoft,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroStatValue: {
    color: appColors.heroText,
    marginTop: 6,
  },
  heroStatHint: {
    color: appColors.heroTextMuted,
    marginTop: 6,
  },
  featuredCard: {
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  featuredHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  featuredEyebrow: {
    color: appColors.heroAccent,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  featuredTitle: {
    color: appColors.heroText,
    marginTop: 4,
  },
  featuredCopy: {
    color: appColors.heroTextSoft,
  },
  featuredToneRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featuredToneChip: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.18)",
  },
  featuredToneChipText: {
    color: appColors.heroText,
    fontWeight: "600",
  },
  filtersCard: {
    borderRadius: 26,
    backgroundColor: appColors.surface,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    color: appColors.textPrimary,
    marginTop: 2,
  },
  sectionCopy: {
    color: appColors.textSecondary,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  toneFilterChip: {
    borderRadius: 16,
    minWidth: 52,
    justifyContent: "center",
  },
  toneFilterText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  countChip: {
    backgroundColor: appColors.surface,
    borderRadius: 16,
  },
  countChipSelected: {
    backgroundColor: appColors.primary,
  },
  countChipText: {
    color: appColors.textPrimary,
    fontWeight: "600",
  },
  countChipTextSelected: {
    color: appColors.onPrimary,
  },
  searchbar: {
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.outlineVariant,
  },
  searchInput: {
    color: appColors.textPrimary,
  },
  activeFiltersPanel: {
    borderRadius: 20,
    backgroundColor: appColors.surfaceAlt,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: appColors.outlineVariant,
  },
  activeFiltersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  activeFiltersTitle: {
    color: appColors.textPrimary,
    fontWeight: "700",
  },
  activeFiltersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activeFilterPill: {
    borderRadius: 999,
    backgroundColor: appColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeFilterText: {
    color: appColors.textSecondary,
    fontWeight: "600",
  },
  loadingIndicatorRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  loadingText: {
    color: appColors.textSecondary,
  },
  skeletonList: {
    width: "100%",
    gap: 12,
    marginTop: 8,
  },
  skeletonCard: {
    borderRadius: 24,
    backgroundColor: appColors.surfaceAlt,
    borderWidth: 1,
    borderColor: appColors.outlineVariant,
    padding: 18,
    gap: 14,
  },
  skeletonHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  skeletonTitleBlock: {
    flex: 1,
    gap: 8,
  },
  skeletonTitle: {
    height: 18,
    width: "46%",
    borderRadius: 24,
    backgroundColor: appColors.outlineVariant,
  },
  skeletonSubtitle: {
    height: 14,
    width: "70%",
    borderRadius: 999,
    backgroundColor: appColors.surfaceVariant,
  },
  skeletonBadge: {
    width: 64,
    height: 32,
    borderRadius: 999,
    backgroundColor: appColors.surfaceVariant,
  },
  skeletonMetaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  skeletonMetaPill: {
    width: 104,
    height: 34,
    borderRadius: 999,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.outlineVariant,
  },
  skeletonToneRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  skeletonTonePill: {
    width: 78,
    height: 30,
    borderRadius: 999,
    backgroundColor: appColors.surfaceVariant,
  },
  skeletonTonePillShort: {
    width: 56,
    height: 30,
    borderRadius: 999,
    backgroundColor: appColors.surfaceVariant,
  },
  emptyHelperRow: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: appColors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyHelperText: {
    color: appColors.textSecondary,
    fontWeight: "600",
  },
  listSection: {
    gap: 14,
  },
  footerText: {
    color: appColors.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
});
